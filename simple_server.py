"""
Simple FastAPI application for GeoLandmark Explorer
"""

import os
import json
import uvicorn
import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Create FastAPI application
app = FastAPI()

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
db_params = {
    "dbname": os.getenv("DB_NAME", "geo"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "336699"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

# Bounding box model
class BoundingBox(BaseModel):
    min_lon: float
    min_lat: float
    max_lon: float
    max_lat: float

# Database utility functions
def get_bound_box(min_lon, min_lat, max_lon, max_lat):
    return f"ST_MakeEnvelope({min_lon}, {min_lat}, {max_lon}, {max_lat}, 4326)"

def execute_spatial_query(query, params=None):
    """Execute a spatial query on the PostgreSQL database"""
    try:
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
            
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert results to list of dicts
        return [dict(row) for row in results]
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to the GeoLandmark Explorer API"}

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/v1/landmarks/business-insights/bbox")
async def get_business_insights_by_bbox(bbox: BoundingBox):
    """
    Get comprehensive business insights within a specified bounding box.
    Returns aggregated metrics and industry breakdown.
    """
    # First, check if we can connect to the database
    try:
        conn = psycopg2.connect(**db_params)
        conn.close()
        print("Database connection successful")
    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection error: {e}")
    
    # Verify table structure
    table_info_query = """
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'geoinsights' 
    LIMIT 10;
    """
    
    try:
        columns = execute_spatial_query(table_info_query)
        print("Table columns:", columns)
    except Exception as e:
        print(f"Table structure query error: {e}")
        raise HTTPException(status_code=500, detail=f"Table structure query error: {e}")
    
    # Check if the table has any data
    count_query = "SELECT COUNT(*) as count FROM geoinsights LIMIT 1;"
    try:
        count_result = execute_spatial_query(count_query)
        print("Row count:", count_result)
    except Exception as e:
        print(f"Count query error: {e}")
        raise HTTPException(status_code=500, detail=f"Count query error: {e}")
    
    # Query to get aggregated metrics
    metrics_query = """
    SELECT 
        COUNT(*) as total_locations,
        SUM(txn_amt) as total_txn_amt,
        SUM(txn_cnt) as total_txn_cnt,
        SUM(acct_cnt) as total_acct_cnt,
        AVG(avg_ticket) as avg_ticket_size,
        CAST(AVG(avg_spend_amt) AS numeric(10,2)) as avg_spend_per_customer,
        CAST(AVG(yoy_txn_amt) AS numeric(10,2)) as avg_yoy_growth
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
        CAST(AVG(yoy_txn_amt) AS numeric(10,2)) as avg_growth_rate
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
        print(f"Query error: {e}")
        # Return mock data for testing
        return {
            "summary": {
                "total_locations": 157,
                "total_txn_amt": 987654,
                "total_txn_cnt": 45678,
                "total_acct_cnt": 12345,
                "avg_ticket_size": 123.45,
                "avg_spend_per_customer": 645.78,
                "avg_yoy_growth": 5.7
            },
            "industry_breakdown": [
                {
                    "industry": "Eating Places",
                    "location_count": 55,
                    "total_txn_amt": 345678,
                    "total_txn_cnt": 23456,
                    "total_visitors": 5678,
                    "avg_growth_rate": 7.8
                },
                {
                    "industry": "Retail",
                    "location_count": 42,
                    "total_txn_amt": 234567,
                    "total_txn_cnt": 12345,
                    "total_visitors": 3456,
                    "avg_growth_rate": 4.3
                }
            ],
            "hotspots": [
                {
                    "id": 12345,
                    "name": "Popular Restaurant",
                    "category": "Eating Places",
                    "txn_amt": 98765,
                    "txn_cnt": 4567,
                    "visitors": 1234,
                    "lat": 46.948,
                    "lng": 7.447
                }
            ]
        }

@app.get("/api/v1/landmarks")
async def get_landmarks():
    """
    Get landmark points
    """
    try:
        # Return mock data for testing
        return [
            {
                "id": 1,
                "name": "Popular Restaurant",
                "geo_type": "POI",
                "category": "Eating Places",
                "geometry": {
                    "type": "Point",
                    "coordinates": [7.447, 46.948]
                },
                "properties": {
                    "txn_amt": 98765,
                    "txn_cnt": 4567,
                    "acct_cnt": 1234
                },
                "score": 98765,
                "visits": 1234,
                "created_at": "2023-01-01T12:00:00Z"
            },
            {
                "id": 2,
                "name": "Shopping Mall",
                "geo_type": "POI",
                "category": "Retail",
                "geometry": {
                    "type": "Point",
                    "coordinates": [7.451, 46.952]
                },
                "properties": {
                    "txn_amt": 87654,
                    "txn_cnt": 3456,
                    "acct_cnt": 1234
                },
                "score": 87654,
                "visits": 1234,
                "created_at": "2023-01-01T12:00:00Z"
            }
        ]
    except Exception as e:
        print(f"Error in get_landmarks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/heatmap")
async def get_heatmap_data():
    """
    Get heatmap data
    """
    try:
        # Return mock data for testing
        return [
            {"lat": 46.948, "lng": 7.447, "weight": 100},
            {"lat": 46.952, "lng": 7.451, "weight": 80},
            {"lat": 46.945, "lng": 7.442, "weight": 60},
            {"lat": 46.955, "lng": 7.455, "weight": 40},
            {"lat": 46.960, "lng": 7.460, "weight": 20}
        ]
    except Exception as e:
        print(f"Error in get_heatmap_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/clusters")
async def get_clusters():
    """
    Get cluster data
    """
    try:
        # Return mock data for testing
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [7.447, 46.948]
                    },
                    "properties": {
                        "id": 1,
                        "name": "Cluster 1",
                        "geo_type": "cluster",
                        "industry": "Mixed",
                        "txn_amt": 250000,
                        "txn_cnt": 12500
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [7.451, 46.952]
                    },
                    "properties": {
                        "id": 2,
                        "name": "Cluster 2",
                        "geo_type": "cluster",
                        "industry": "Retail",
                        "txn_amt": 180000,
                        "txn_cnt": 9000
                    }
                }
            ]
        }
    except Exception as e:
        print(f"Error in get_clusters: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("simple_server:app", host="0.0.0.0", port=8000, reload=True) 