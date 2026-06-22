const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

// Initialize Gemini API if key is available
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✨ Gemini LLM Service initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize Gemini LLM Service:', err.message);
  }
} else {
  console.log('⚠️ GEMINI_API_KEY is not defined. Using Smart Offline Mock LLM Service.');
}

// Smart Mock Generator helper
function generateMockTripData(destination, numberOfDays, budgetType, interests) {
  console.log(`🤖 generating offline mock itinerary for: ${destination}, ${numberOfDays} days, budget: ${budgetType}`);
  
  // Cost multipliers based on budget preference and standard tiering
  const multiplier = budgetType === 'low' ? 0.6 : budgetType === 'high' ? 2.5 : 1.2;
  const daysCount = parseInt(numberOfDays) || 3;
  
  // Dynamic budgets
  const flightCost = Math.round(350 * multiplier);
  const accomCost = Math.round(75 * daysCount * multiplier);
  const foodCost = Math.round(30 * daysCount * multiplier);
  const actCost = Math.round(25 * daysCount * multiplier);
  const totalCost = flightCost + accomCost + foodCost + actCost;

  // Mock hotels
  const mockHotels = [
    {
      name: `${destination} Cozy Inn`,
      priceLevel: budgetType === 'low' ? 'Budget Friendly' : 'Mid Range',
      rating: '4.2',
      description: 'Comfortable stay close to main transport links and local food spots.'
    },
    {
      name: `${destination} Plaza & Suites`,
      priceLevel: budgetType === 'high' ? 'Luxury' : 'Mid Range',
      rating: '4.6',
      description: 'Premium amenities, scenic views, and excellent service standard.'
    },
    {
      name: `${destination} Royal Palace Hotel`,
      priceLevel: 'Luxury',
      rating: '4.9',
      description: 'World-class luxury with signature dining, spa facilities, and historical elegance.'
    }
  ];

  // Activities bank based on interests
  const activitiesBank = {
    food: [
      { name: 'Local Food Street Walk', desc: 'Savor traditional snacks and authentic street delicacies.', cost: 15 },
      { name: 'Traditional Cooking Masterclass', desc: 'Learn to prepare classic local dishes from a professional chef.', cost: 50 },
      { name: 'Famous Gastronomy District Tour', desc: 'A guided culinary crawl covering hidden local taverns and diners.', cost: 40 },
      { name: 'Michelin Star Dining Experience', desc: 'Indulge in a premium multi-course dinner matching regional flavors.', cost: 120 }
    ],
    culture: [
      { name: 'Historical Heritage Site Visit', desc: 'Explore famous monuments, temples, and architectural marvels.', cost: 10 },
      { name: 'Art Gallery & Museum Guided Tour', desc: 'Admire masterpieces and exhibitions highlighting local art history.', cost: 20 },
      { name: 'Old Quarter Preservation Walk', desc: 'Witness ancient houses, craft shops, and age-old lifestyle practices.', cost: 5 },
      { name: 'Traditional Performing Arts Show', desc: 'Enjoy live theatre, dance, or music expressing native folklore.', cost: 35 }
    ],
    adventure: [
      { name: 'Nature Trekking & Hiking Trail', desc: 'Hike up to scenic viewpoints through lush forests and pathways.', cost: 0 },
      { name: 'Outdoor Ziplining or Canopy Walk', desc: 'Experience a thrilling high-altitude course over forest trees.', cost: 45 },
      { name: 'Water Sports Adventure', desc: 'Go kayaking, rafting, or snorkelling in clear pristine waters.', cost: 60 },
      { name: 'All-Terrain ATV Safari Tour', desc: 'Navigate dirt tracks and rugged valleys on a motorized off-road buggy.', cost: 80 }
    ],
    shopping: [
      { name: 'Bustling Local Flea Market Market', desc: 'Hunt for unique souvenirs, handicrafts, and vintage clothes.', cost: 0 },
      { name: 'Upscale Fashion Boulevard Stroll', desc: 'Browse international designer boutiques and luxury malls.', cost: 0 },
      { name: 'Artisanal Craft Workshops', desc: 'Shop handmade jewelry, silks, pottery directly from craftsmen.', cost: 25 },
      { name: 'Electronic & Modern Culture District', desc: 'Discover gadgets, pop culture collectibles, and tech hubs.', cost: 10 }
    ],
    nature: [
      { name: 'Botanical Gardens & Conservatory Walk', desc: 'Stroll through curated flora species, orchids, and greenhouses.', cost: 8 },
      { name: 'Panoramic Mountain viewpoint cable car', desc: 'Ascend in a cabin for panoramic views of surrounding valleys.', cost: 25 },
      { name: 'Scenic Lake Boat Ride & Picnic', desc: 'Relax on a tranquil wooden boat and enjoy snacks along the banks.', cost: 15 },
      { name: 'Sunrise Hiking Expedition', desc: 'Wake up early to catch a breathtaking sunrise view above the clouds.', cost: 10 }
    ]
  };

  // Compile selected interests
  let userInterests = interests && interests.length > 0 ? interests : ['culture', 'food'];
  
  // Day-by-day itinerary constructor
  const mockItinerary = [];
  for (let i = 1; i <= daysCount; i++) {
    const dayActivities = [];
    
    // Choose 2 main activities per day based on interests
    userInterests.forEach((interest, idx) => {
      const bank = activitiesBank[interest.toLowerCase()] || activitiesBank.culture;
      // Cyclically pick activities so we do not go out of bounds
      const activityIndex = (i + idx) % bank.length;
      const bankActivity = bank[activityIndex];
      
      const time = idx === 0 ? '09:30 AM' : '02:30 PM';
      dayActivities.push({
        id: `m_d${i}_a${idx + 1}`,
        time,
        activityName: bankActivity.name,
        description: bankActivity.desc,
        cost: Math.round(bankActivity.cost * multiplier)
      });
    });

    mockItinerary.push({
      dayNumber: i,
      activities: dayActivities
    });
  }

  return {
    itinerary: mockItinerary,
    estimatedBudget: {
      flights: flightCost,
      accommodation: accomCost,
      food: foodCost,
      activities: actCost,
      total: totalCost
    },
    hotels: mockHotels
  };
}

// Generate Full Trip
exports.generateTripItinerary = async (destination, numberOfDays, budgetType, interests) => {
  if (!genAI) {
    return generateMockTripData(destination, numberOfDays, budgetType, interests);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert travel AI agent. Generate a detailed travel plan for a trip to "${destination}".
      Details:
      - Duration: ${numberOfDays} days
      - Budget tier: ${budgetType} (adjust pricing expectations: low/budget, medium/moderate, high/luxury)
      - Interests: ${interests.join(', ')}

      Respond ONLY with a valid, raw JSON object. Do not wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\` or include any explanations.

      The JSON structure MUST follow this exact schema:
      {
        "itinerary": [
          {
            "dayNumber": 1,
            "activities": [
              { "id": "d1a1", "time": "09:00 AM", "activityName": "Name of activity", "description": "Brief description", "cost": 15 }
            ]
          }
        ],
        "estimatedBudget": {
          "flights": 450,
          "accommodation": 300,
          "food": 180,
          "activities": 120,
          "total": 1050
        },
        "hotels": [
          { "name": "Hotel Name", "priceLevel": "Budget Friendly / Mid Range / Luxury", "rating": "4.5", "description": "Short description" }
        ]
      }

      Provide realistic estimates based on current costs for ${destination} and ${numberOfDays} days under the ${budgetType} budget tier. Costs must be in USD.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean potential markdown wrapped backticks if LLM disobeyed
    let cleanText = text;
    if (text.startsWith('```')) {
      cleanText = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const data = JSON.parse(cleanText);
    return data;
  } catch (err) {
    console.error('Error generating itinerary via Gemini API:', err);
    console.log('Falling back to offline mock generator due to API error.');
    return generateMockTripData(destination, numberOfDays, budgetType, interests);
  }
};

// Regenerate a single day
exports.regenerateSingleDay = async (destination, budgetType, dayNumber, currentDayActivities, promptText) => {
  if (!genAI) {
    console.log(`🤖 Offline mock: Regenerating Day ${dayNumber} with prompt: "${promptText}"`);
    const multiplier = budgetType === 'low' ? 0.6 : budgetType === 'high' ? 2.5 : 1.2;
    // Mock new activities for this day based on the instruction
    const isOutdoor = promptText.toLowerCase().includes('outdoor') || promptText.toLowerCase().includes('adventure');
    const isRelaxed = promptText.toLowerCase().includes('relax') || promptText.toLowerCase().includes('chill');
    
    let activity1Name = `Specialist Sightseeing Tour`;
    let activity1Desc = `Custom explorer walk incorporating: "${promptText}"`;
    let activity1Cost = 20;

    let activity2Name = `Themed Evening Activity`;
    let activity2Desc = `An customized dining and cultural immersion event matching your request.`;
    let activity2Cost = 30;

    if (isOutdoor) {
      activity1Name = `Nature Trail & Viewpoint Hike`;
      activity1Desc = `Scenic outdoor climb matching the request for more outdoor exploration.`;
      activity1Cost = 10;
      activity2Name = `Riverside Kayaking & Outdoors`;
      activity2Desc = `Active outdoor boating on local waters.`;
      activity2Cost = 45;
    } else if (isRelaxed) {
      activity1Name = `Leisurely Cafe Stroll`;
      activity1Desc = `Slow morning exploring quiet streets and tasting warm drinks.`;
      activity1Cost = 12;
      activity2Name = `Wellness Spa & Massage`;
      activity2Desc = `Premium therapeutic relaxation session.`;
      activity2Cost = 75;
    }

    return [
      {
        id: `reg_d${dayNumber}_a1_${Date.now()}`,
        time: '10:00 AM',
        activityName: activity1Name,
        description: activity1Desc,
        cost: Math.round(activity1Cost * multiplier)
      },
      {
        id: `reg_d${dayNumber}_a2_${Date.now()}`,
        time: '04:00 PM',
        activityName: activity2Name,
        description: activity2Desc,
        cost: Math.round(activity2Cost * multiplier)
      }
    ];
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert travel AI agent.
      The user wants to regenerate the activities of Day ${dayNumber} for a trip to "${destination}".
      The user's specific request is: "${promptText}".
      
      Current activities on Day ${dayNumber} were:
      ${JSON.stringify(currentDayActivities, null, 2)}

      Please regenerate and improve the activities for Day ${dayNumber} adhering strictly to the user request.
      Respond ONLY with a valid, raw JSON array of activity objects. Do not wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\` or include any explanations.

      The JSON structure MUST follow this exact schema:
      [
        {
          "id": "unique-activity-id",
          "time": "10:00 AM",
          "activityName": "Name of new activity",
          "description": "Brief description matching their instructions",
          "cost": 25
        }
      ]

      Ensure all activity details and costings match the overall ${budgetType} budget tier. Costs must be in USD.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    let cleanText = text;
    if (text.startsWith('```')) {
      cleanText = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const data = JSON.parse(cleanText);
    return data;
  } catch (err) {
    console.error('Error regenerating day via Gemini API:', err);
    // Simple fallback
    return [
      {
        id: `fallback_${dayNumber}_1`,
        time: '10:00 AM',
        activityName: `Alternative Sightseeing in ${destination}`,
        description: `Enjoy a customized sightseeing itinerary matching: "${promptText}"`,
        cost: 15
      },
      {
        id: `fallback_${dayNumber}_2`,
        time: '03:00 PM',
        activityName: `Specialty Local Activity`,
        description: `Explore unique spots satisfying: "${promptText}"`,
        cost: 30
      }
    ];
  }
};
