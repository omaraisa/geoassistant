import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getSalesData, getRentalData, getSupplyData } from '@/lib/data/queries';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-pro-latest'),
    messages,
    system: `You are a GeoAI Assistant for Abu Dhabi Real Estate. 
    You have access to real estate data (Sales, Rent, Supply) and can control a map.
    
    When asked about data:
    1. Use the appropriate tool (get_sales_info, get_rental_info, etc.) to fetch data.
    2. Always summarize the data clearly.
    3. If the data is specific to a location (e.g., "Yas Island"), ALWAYS use the 'update_map' tool to zoom to that location.
    
    When asked to compare:
    1. Fetch data for both entities.
    2. Present a comparison.
    
    Data is available for years 2019-2025 mostly.
    Districts include: Yas Island, Al Reem Island, Saadiyat Island, etc.
    `,
    tools: {
      get_sales_info: tool({
        description: 'Get sales transaction data (volume, value) for a district/year',
        parameters: z.object({
          district: z.string().optional().describe('District name e.g. Yas Island'),
          year: z.string().optional().describe('Year e.g. 2024'),
          typology: z.string().optional().describe('Property type e.g. Apartment / Duplex, Villa / Townhouse'),
          metric: z.enum(['volume', 'value']).optional()
        }),
        execute: async (params) => {
          const data = await getSalesData(params);
          return data;
        },
      }),
      get_rental_info: tool({
        description: 'Get rental index data (average rent) for a district/year',
        parameters: z.object({
          district: z.string().optional(),
          year: z.string().optional(),
          typology: z.string().optional(),
        }),
        execute: async (params) => {
          const data = await getRentalData(params);
          return data;
        },
      }),
      get_supply_info: tool({
        description: 'Get housing supply data for a district/year',
        parameters: z.object({
          district: z.string().optional(),
          year: z.string().optional(),
        }),
        execute: async (params) => {
          const data = await getSupplyData(params);
          return data;
        },
      }),
      update_map: tool({
        description: 'Update the map view (zoom to location)',
        parameters: z.object({
          location: z.string().describe('Name of the location to zoom to e.g. Yas Island'),
        }),
        execute: async ({ location }) => {
          // This runs on server, but client will see the tool invocation
          return { success: true, location, message: `Map updated to ${location}` };
        },
      }),
      visualize_data: tool({
        description: 'Visualize data in a chart (bar or line)',
        parameters: z.object({
          title: z.string().describe('Chart title'),
          type: z.enum(['bar', 'line']).describe('Chart type'),
          data: z.array(z.record(z.any())).describe('Data points for the chart'),
          xAxisKey: z.string().describe('Key for X axis (e.g. year, district)'),
          seriesKeys: z.array(z.string()).describe('Keys for data series (e.g. value, volume)')
        }),
        execute: async (params) => {
          return { success: true, ...params };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
