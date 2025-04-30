"""
API routes for landmarks and spatial data
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

from api.db.database import execute_spatial_query, get_bound_box
from api.schemas.spatial import (
    GeoInsight, BoundingBox, GeoPoint, 
    GeoFeatureCollection, Landmark, SpatialQuery
)

router = APIRouter()

@router.get("/landmarks", response_model=List[Landmark])
async def get_landmarks(
    geo_type: Optional[str] = Query(None, description="Filter by geographic type"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Get landmark centroids for faster initial loading.
    """
    query_base = """
    SELECT 
        id, 
        geo_name as name, 
        geo_type, 
        industry as category,
        ST_AsGeoJSON(ST_Centroid(geometry))::json as geometry, 
        json_build_object(
            'txn_amt', txn_amt,
            'txn_cnt', txn_cnt,
            'acct_cnt', acct_cnt
        ) as properties,
        txn_amt as score,
        acct_cnt as visits,
        txn_date as created_at
    FROM geoinsights 
    WHERE geometry IS NOT NULL
    """
    
    params = []
    filter_clauses = []

    if geo_type:
        filter_clauses.append("geo_type = %s")
        params.append(geo_type)
        
    if category:
        filter_clauses.append("industry = %s")
        params.append(category)
    
    # Construct the final query string
    query = query_base
    if filter_clauses:
        query += " AND " + " AND ".join(filter_clauses)

    # Append ORDER BY, LIMIT, and OFFSET using %s
    query += " ORDER BY txn_amt DESC LIMIT %s"
    params.append(limit)
    
    # Add offset parameter only if non-zero
    if offset > 0:
        query += " OFFSET %s"
        params.append(offset)
    
    try:
        # Debugging: Print the final query and params before execution
        print("--- Executing Landmarks Query ---")
        print(f"Query: {query}")
        print(f"Params: {params}")
        print("---------------------------------")
        
        results = execute_spatial_query(query, params)
        return results
    except Exception as e:
        print(f"Error executing landmark centroid query: {e}") 
        print(f"Query: {query}")
        print(f"Params: {params}")
        raise HTTPException(status_code=500, detail=f"Query error: {e}")

@router.post("/landmarks/bbox", response_model=List[Landmark])
async def get_landmarks_in_bbox(bbox: BoundingBox):
    """
    Get landmarks within a specified bounding box
    """
    query = """
    SELECT 
        id, 
        geo_name as name, 
        geo_type, 
        industry as category,
        ST_AsGeoJSON(geometry)::json as geometry,
        json_build_object(
            'txn_amt', txn_amt,
            'txn_cnt', txn_cnt,
            'acct_cnt', acct_cnt
        ) as properties,
        txn_amt as score,
        acct_cnt as visits,
        txn_date as created_at
    FROM geoinsights 
    WHERE ST_Intersects(
        geometry, 
        {bbox}
    )
    ORDER BY txn_amt DESC
    LIMIT 100
    """.format(
        bbox=get_bound_box(bbox.min_lon, bbox.min_lat, bbox.max_lon, bbox.max_lat)
    )
    
    try:
        results = execute_spatial_query(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {e}")

@router.get("/heatmap", response_model=List[Dict[str, Any]])
async def get_heatmap_data(
    year: Optional[int] = Query(None, description="Filter by year"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    segment: Optional[str] = Query(None, description="Filter by segment"),
    limit: int = Query(5000, ge=1, le=10000)
):
    """
    Get heatmap data for transaction amounts
    """
    query = """
    SELECT 
        central_latitude as lat, 
        central_longitude as lng, 
        txn_amt as weight
    FROM geoinsights 
    WHERE 
        central_latitude IS NOT NULL AND
        central_longitude IS NOT NULL AND
        txn_amt IS NOT NULL AND
        txn_amt > 0
    """
    
    params = []
    
    if year:
        query += " AND year = %s"
        params.append(year)
        
    if industry:
        query += " AND industry = %s"
        params.append(industry)
        
    if segment:
        query += " AND segment = %s"
        params.append(segment)
    
    query += " ORDER BY txn_amt DESC LIMIT %s"
    params.append(limit)
    
    try:
        results = execute_spatial_query(query, params)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {e}")

@router.get("/clusters", response_model=GeoFeatureCollection)
async def get_landmark_clusters(
    min_txn_amt: float = Query(100.0, description="Minimum transaction amount for clustering"),
    limit: int = Query(1000, ge=1, le=5000)
):
    """
    Get clustered landmarks based on transaction amount
    """
    query = """
    SELECT 
        json_build_object(
            'type', 'FeatureCollection',
            'features', json_agg(
                json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(geometry)::json,
                    'properties', json_build_object(
                        'id', id,
                        'name', geo_name,
                        'geo_type', geo_type,
                        'industry', industry,
                        'txn_amt', txn_amt,
                        'txn_cnt', txn_cnt
                    )
                )
            )
        ) as geojson
    FROM (
        SELECT 
            id, geo_name, geo_type, industry, 
            txn_amt, txn_cnt, geometry
        FROM geoinsights
        WHERE 
            txn_amt > %s AND
            geometry IS NOT NULL
        ORDER BY txn_amt DESC
        LIMIT %s
    ) AS landmarks
    """
    
    try:
        results = execute_spatial_query(query, [min_txn_amt, limit])
        if results and results[0]['geojson']:
            return results[0]['geojson']
        else:
            return {"type": "FeatureCollection", "features": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {e}")

@router.get("/stats/regions", response_model=List[Dict[str, Any]])
async def get_region_stats():
    """
    Get transaction statistics by region
    """
    query = """
    SELECT 
        geo_name, 
        geo_type,
        COUNT(*) as record_count,
        AVG(txn_amt) as avg_txn_amount,
        AVG(txn_cnt) as avg_txn_count,
        AVG(yoy_txn_amt) as avg_yoy_growth
    FROM geoinsights 
    WHERE 
        geo_type = 'State' AND
        txn_amt IS NOT NULL
    GROUP BY geo_name, geo_type
    ORDER BY avg_txn_amount DESC
    """
    
    try:
        results = execute_spatial_query(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {e}")

@router.get("/stats/industries", response_model=List[Dict[str, Any]])
async def get_industry_stats():
    """
    Get transaction statistics by industry
    """
    query = """
    SELECT 
        industry,
        segment,
        COUNT(*) as record_count,
        AVG(txn_amt) as avg_txn_amount,
        AVG(txn_cnt) as avg_txn_count,
        AVG(yoy_txn_amt) as avg_yoy_growth
    FROM geoinsights 
    WHERE 
        industry IS NOT NULL AND
        txn_amt IS NOT NULL
    GROUP BY industry, segment
    ORDER BY avg_txn_amount DESC
    """
    
    try:
        results = execute_spatial_query(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {e}")

@router.post("/business-insights/bbox", response_model=Dict[str, Any])
async def get_business_insights_by_bbox(bbox: BoundingBox):
    """
    Get comprehensive business insights within a specified bounding box.
    Returns aggregated metrics and industry breakdown.
    """
    # Query to get aggregated metrics
    metrics_query = """
    SELECT 
        COUNT(*) as total_locations,
        SUM(txn_amt) as total_txn_amt,
        SUM(txn_cnt) as total_txn_cnt,
        SUM(acct_cnt) as total_acct_cnt,
        AVG(avg_ticket) as avg_ticket_size,
        ROUND(AVG(avg_spend_amt), 2) as avg_spend_per_customer,
        ROUND(AVG(yoy_txn_amt), 2) as avg_yoy_growth
    FROM geoinsights 
    WHERE ST_Intersects(
        geometry, 
        {bbox}
    )
    """.format(
        bbox=get_bound_box(bbox.min_lon, bbox.min_lat, bbox.max_lon, bbox.max_lat)
    )
    
    # Query to get industry breakdown
    industry_query = """
    SELECT 
        industry,
        COUNT(*) as location_count,
        SUM(txn_amt) as total_txn_amt,
        SUM(txn_cnt) as total_txn_cnt,
        SUM(acct_cnt) as total_visitors,
        ROUND(AVG(yoy_txn_amt), 2) as avg_growth_rate
    FROM geoinsights 
    WHERE ST_Intersects(
        geometry, 
        {bbox}
    )
    GROUP BY industry
    ORDER BY total_txn_amt DESC
    """.format(
        bbox=get_bound_box(bbox.min_lon, bbox.min_lat, bbox.max_lon, bbox.max_lat)
    )
    
    # Query to get area hotspots (top points by transaction amount)
    hotspots_query = """
    SELECT 
        id,
        geo_name as name,
        industry as category,
        txn_amt,
        txn_cnt,
        acct_cnt as visitors,
        ST_AsGeoJSON(geometry)::json as geometry,
        central_latitude as lat,
        central_longitude as lng
    FROM geoinsights 
    WHERE ST_Intersects(
        geometry, 
        {bbox}
    )
    ORDER BY txn_amt DESC
    LIMIT 10
    """.format(
        bbox=get_bound_box(bbox.min_lon, bbox.min_lat, bbox.max_lon, bbox.max_lat)
    )
    
    try:
        # Execute all queries
        metrics_results = execute_spatial_query(metrics_query)
        industry_results = execute_spatial_query(industry_query)
        hotspots_results = execute_spatial_query(hotspots_query)
        
        # Return comprehensive insights
        return {
            "summary": metrics_results[0] if metrics_results else {},
            "industry_breakdown": industry_results,
            "hotspots": hotspots_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {e}") 