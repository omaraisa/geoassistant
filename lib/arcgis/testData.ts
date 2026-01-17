/**
 * Test data for feature layer visualization
 * Use this to test map functionality without consuming API credits
 */

export const mockBudgetSearchFeatures = [
  {
    attributes: {
      OBJECTID: 1,
      district: "YAS ISLAND",
      year: 2024,
      layout: "3 beds",
      avgRent: 120000,
      lowerRent: 100000,
      upperRent: 140000,
      typology: "Apartment"
    },
    geometry: {
      rings: [
        [
          [54.6064, 24.4942],
          [54.6164, 24.4942],
          [54.6164, 24.5042],
          [54.6064, 24.5042],
          [54.6064, 24.4942]
        ]
      ],
      spatialReference: { wkid: 4326 }
    }
  },
  {
    attributes: {
      OBJECTID: 2,
      district: "AL REEM ISLAND",
      year: 2024,
      layout: "3 beds",
      avgRent: 150000,
      lowerRent: 130000,
      upperRent: 170000,
      typology: "Apartment"
    },
    geometry: {
      rings: [
        [
          [54.4069, 24.4959],
          [54.4169, 24.4959],
          [54.4169, 24.5059],
          [54.4069, 24.5059],
          [54.4069, 24.4959]
        ]
      ],
      spatialReference: { wkid: 4326 }
    }
  },
  {
    attributes: {
      OBJECTID: 3,
      district: "SAADIYAT ISLAND",
      year: 2024,
      layout: "3 beds",
      avgRent: 180000,
      lowerRent: 160000,
      upperRent: 200000,
      typology: "Apartment"
    },
    geometry: {
      rings: [
        [
          [54.4371, 24.5265],
          [54.4471, 24.5265],
          [54.4471, 24.5365],
          [54.4371, 24.5365],
          [54.4371, 24.5265]
        ]
      ],
      spatialReference: { wkid: 4326 }
    }
  }
];

export const mockTableData = [
  {
    District: "YAS ISLAND",
    "Avg Rent (AED)": "120,000",
    "Lower Rent": "100,000",
    "Upper Rent": "140,000",
    Layout: "3 beds"
  },
  {
    District: "AL REEM ISLAND",
    "Avg Rent (AED)": "150,000",
    "Lower Rent": "130,000",
    "Upper Rent": "170,000",
    Layout: "3 beds"
  },
  {
    District: "SAADIYAT ISLAND",
    "Avg Rent (AED)": "180,000",
    "Lower Rent": "160,000",
    "Upper Rent": "200,000",
    Layout: "3 beds"
  }
];
