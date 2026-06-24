import { Request, Response } from 'express';
import { Router } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

const router = Router();

// GET /services.json - Return list of supported Open311 services
router.get('/services.json', (req: Request, res: Response) => {
  res.json([
    {
      service_code: '001',
      service_name: 'Pothole on Road',
      description: 'Large holes or cracks in public asphalt road surfaces.',
      metadata: false,
      type: 'realtime',
      keywords: 'pothole, road, asphalt',
      group: 'infrastructure'
    },
    {
      service_code: '002',
      service_name: 'Water Leakage',
      description: 'Water leaking from public main pipes or sewer backup.',
      metadata: false,
      type: 'realtime',
      keywords: 'water, leak, pipe, flood',
      group: 'utility'
    },
    {
      service_code: '003',
      service_name: 'Damaged Streetlight',
      description: 'Streetlight not working, flickering, or physically damaged.',
      metadata: false,
      type: 'realtime',
      keywords: 'light, dark, lamp, streetlight',
      group: 'infrastructure'
    },
    {
      service_code: '004',
      service_name: 'Illegal Waste Dumping',
      description: 'Piles of trash, garbage, or hazardous material dumped in public spaces.',
      metadata: false,
      type: 'realtime',
      keywords: 'trash, garbage, dump, waste',
      group: 'sanitation'
    }
  ]);
});

// POST /requests.json - Submit Open311 request (simplified endpoint)
router.post('/requests.json', async (req: Request, res: Response) => {
  const { service_code, description, lat, long, media_url } = req.body;

  if (!service_code || !description || !lat || !long) {
    return res.status(400).json([
      {
        code: '400',
        description: 'Missing required parameters: service_code, description, lat, long'
      }
    ]);
  }

  try {
    const serviceMap: Record<string, string> = {
      '001': 'pothole',
      '002': 'water_leakage',
      '003': 'damaged_streetlight',
      '004': 'waste_dumping'
    };

    const category = serviceMap[service_code] || 'other';

    const issueRef = db.collection('issues').doc();
    const issueId = issueRef.id;

    const issueDoc = {
      reporterId: 'open311_agent',
      mediaUrl: media_url || '',
      mediaType: 'image/jpeg',
      description,
      latitude: parseFloat(lat),
      longitude: parseFloat(long),
      address: `Open311 Geocoded at Lat: ${lat}, Lng: ${long}`,
      category,
      subcategory: 'Open311 Report',
      severity: 'medium',
      priorityScore: 5,
      suggestedDepartment: 'Public Works',
      department: 'Public Works',
      status: 'Pending',
      confidence: 1.0,
      tags: ['open311', category],
      reasoning: 'Imported via Open311 API protocol.',
      consensusScore: 0.0,
      votesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      open311: {
        service_code,
        service_request_id: `req_${issueId.substring(0, 8)}`,
        agency_responsible: 'Public Works'
      }
    };

    await issueRef.set(issueDoc);

    res.status(201).json([
      {
        service_request_id: issueDoc.open311.service_request_id,
        service_notice: 'Open311 ticket created successfully.',
        account_id: 'open311_agent',
        status: 'open',
        updated_datetime: issueDoc.createdAt
      }
    ]);

  } catch (error) {
    logger.error({ error }, 'Error importing Open311 request');
    res.status(500).json([
      {
        code: '500',
        description: 'Internal server error processing Open311 request'
      }
    ]);
  }
});

export default router;
