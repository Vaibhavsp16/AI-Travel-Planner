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
    
    // Choose main activities per day based on interests (no repeated times)
    const dayTimes = ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '07:00 PM'];
    userInterests.forEach((interest, idx) => {
      const bank = activitiesBank[interest.toLowerCase()] || activitiesBank.culture;
      // Cyclically pick activities so we do not go out of bounds
      const activityIndex = (i + idx) % bank.length;
      const bankActivity = bank[activityIndex];
      
      const time = dayTimes[idx % dayTimes.length];
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
// Robust JSON response parser to handle any markdown wrapping or preambles
function cleanAndParseJson(rawText) {
  let cleaned = rawText.trim();
  
  // Try locating the start and end of standard brackets/braces
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  
  return JSON.parse(cleaned);
}

exports.generateTripItinerary = async (destination, numberOfDays, budgetType, interests) => {
  if (!genAI) {
    return generateMockTripData(destination, numberOfDays, budgetType, interests);
  }

  try {
    // Using gemini-pro which is compatible with all @google/generative-ai SDK versions
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
    const text = result.response.text();
    const data = cleanAndParseJson(text);
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
    
    // Dynamically build titles and details matching the user's prompt text to give relevant results when offline
    const lowerPrompt = promptText.toLowerCase();
    const isOutdoor = lowerPrompt.includes('outdoor') || lowerPrompt.includes('adventure') || lowerPrompt.includes('hike') || lowerPrompt.includes('nature');
    const isRelaxed = lowerPrompt.includes('relax') || lowerPrompt.includes('chill') || lowerPrompt.includes('spa') || lowerPrompt.includes('slow');
    const isFood = lowerPrompt.includes('food') || lowerPrompt.includes('eat') || lowerPrompt.includes('dining') || lowerPrompt.includes('restaurant') || lowerPrompt.includes('culinary');
    const isShopping = lowerPrompt.includes('shop') || lowerPrompt.includes('market') || lowerPrompt.includes('buy');

    let activity1Name = `Explore ${destination} Highlights`;
    let activity1Desc = `Sightseeing tour focusing on: "${promptText}"`;
    let activity1Cost = 15;

    let activity2Name = `Custom Evening Experience`;
    let activity2Desc = `An immersive local activity custom tailored to your request: "${promptText}"`;
    let activity2Cost = 25;

    if (isOutdoor) {
      activity1Name = `Scenic Hiking & Outdoor Trek`;
      activity1Desc = `Explore beautiful nature trails and viewpoints around ${destination} as requested.`;
      activity1Cost = 10;
      activity2Name = `Adventure Water Sports & Rafting`;
      activity2Desc = `Thrilling outdoor boating and watersports session.`;
      activity2Cost = 45;
    } else if (isRelaxed) {
      activity1Name = `Leisurely Botanical Walk`;
      activity1Desc = `Enjoy a relaxed walk around the most peaceful gardens in the area.`;
      activity1Cost = 8;
      activity2Name = `Traditional Spa & Hot Baths`;
      activity2Desc = `Full therapeutic massage and relaxation session to unwind.`;
      activity2Cost = 70;
    } else if (isFood) {
      activity1Name = `Gourmet Food District Crawl`;
      activity1Desc = `Guided culinary crawl tasting traditional local snacks and appetizers.`;
      activity1Cost = 35;
      activity2Name = `Fine Dining Multi-Course Experience`;
      activity2Desc = `Premium local restaurant dinner matching your culinary interests.`;
      activity2Cost = 75;
    } else if (isShopping) {
      activity1Name = `Local Flea Market Exploration`;
      activity1Desc = `Browse stalls of artisanal crafts, antiques, and local goods.`;
      activity1Cost = 0;
      activity2Name = `High-End Boutique Shopping`;
      activity2Desc = `Visit upscale shopping plazas and purchase custom souvenirs.`;
      activity2Cost = 50;
    } else {
      // Dynamic fallback based on prompt words
      const words = promptText.split(' ').slice(0, 3).join(' ');
      activity1Name = `Specialty Activity: ${words}`;
      activity1Desc = `Morning activities customized for: "${promptText}"`;
      activity2Name = `Explorer Session: ${words}`;
      activity2Desc = `Afternoon immersion aligned with: "${promptText}"`;
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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
      You are an expert travel AI agent.
      The user wants to completely rewrite the activities of Day ${dayNumber} for a trip to "${destination}".
      The user's specific request is: "${promptText}".
      
      Previous activities on Day ${dayNumber} were:
      ${JSON.stringify(currentDayActivities, null, 2)}

      Instructions:
      1. Completely rewrite the itinerary for Day ${dayNumber} so that the schedule is ENTIRELY centric to the user request: "${promptText}".
      2. Do NOT just tweak the old activities. Instead, replace them with fresh, highly relevant activities that fully satisfy this prompt.
      3. Design between 2 to 4 distinct activities distributed chronologically across the day (e.g. Morning, Afternoon, Evening).
      4. Make the activity names, descriptions, and costs detailed, satisfying, and realistic for ${destination} under the ${budgetType} budget preference.

      Respond ONLY with a valid, raw JSON array of activity objects. Do not wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\` or include any explanations.

      The JSON structure MUST follow this exact schema:
      [
        {
          "id": "unique-activity-id",
          "time": "09:00 AM", // specify clear distinct times for each activity (e.g., 09:00 AM, 02:00 PM, 06:30 PM)
          "activityName": "Highly thematic activity title",
          "description": "Engaging description showcasing how this fulfills the user instruction: ${promptText}",
          "cost": 20
        }
      ]

      Ensure all activity details and costings match the overall ${budgetType} budget tier. Costs must be in USD.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = cleanAndParseJson(text);
    return data;
  } catch (err) {
    console.error('Error regenerating day via Gemini API:', err);
    // Dynamic fallback in case of errors
    return [
      {
        id: `fallback_${dayNumber}_1_${Date.now()}`,
        time: '10:00 AM',
        activityName: `Alternative Sightseeing (${promptText.split(' ').slice(0,3).join(' ')})`,
        description: `Enjoy a customized sightseeing itinerary matching: "${promptText}"`,
        cost: 15
      },
      {
        id: `fallback_${dayNumber}_2_${Date.now()}`,
        time: '03:00 PM',
        activityName: `Specialty Local Activity (${promptText.split(' ').slice(0,3).join(' ')})`,
        description: `Explore unique spots satisfying: "${promptText}"`,
        cost: 30
      }
    ];
  }
};
