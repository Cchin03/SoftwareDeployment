// src/app/api/health/route.ts
// Health check endpoint for monitoring and load balancers

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    
    // Simple health check query
    await connection.query('SELECT 1');
    connection.release();

    // Return health status
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'ok',
        memory: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// Liveness probe - is the app running?
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
