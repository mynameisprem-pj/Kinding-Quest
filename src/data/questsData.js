export const LEVELS_META = [
  {
    level: 1,
    title: 'Level 1: The Helping Hand',
    subtitle: 'Community Cooperation & Lending Support',
    themeIcon: '🤝',
    skyTint: 0x000000,
    skyAlpha: 0,
    description: 'Help neighbors with everyday challenges—delivering groceries, sharing books, planting the garden, and cooking a community feast.',
    realWorldFact: '🌍 Real-World Impact: 1 in 4 seniors faces mobility or social isolation challenges. Checking in on a neighbor for just 10 minutes a week measurably improves community health and trust.',
    playable: true
  },
  {
    level: 2,
    title: 'Level 2: Clean & Green Village',
    subtitle: 'Civic Pride, Sweeping & Eco-Stewardship',
    themeIcon: '🧹',
    skyTint: 0xfef08a,
    skyAlpha: 0.08,
    description: 'A windstorm left litter across Havenwood! Grab a broom to sweep the streets, sort recyclables, and shut off leaking water taps.',
    realWorldFact: '🌍 Real-World Impact: A single leaking water tap can waste over 3,000 gallons a year, and clean neighborhood streets reduce local waterway pollution by up to 60%.',
    playable: true
  },
  {
    level: 3,
    title: 'Level 3: Respecting Elders & Empathy',
    subtitle: 'Polite Manners, Patience & Inclusion',
    themeIcon: '🙏',
    skyTint: 0xf97316,
    skyAlpha: 0.14,
    description: 'Practice respectful greetings with village elders, recover cherished memories, and help a shy newcomer feel welcome.',
    realWorldFact: '🌍 Real-World Impact: Intergenerational connection and active inclusion reduce youth anxiety and preserve priceless cultural wisdom in our communities.',
    playable: true
  },
  {
    level: 4,
    title: 'Level 4: Animal Shelter & Wildlife',
    subtitle: 'Compassion for Living Creatures',
    themeIcon: '🐾',
    playable: false,
    comingSoonText: 'Coming Soon in Expansion Pack — Rescue stray pets & build birdhouses!'
  },
  {
    level: 5,
    title: 'Level 5: Digital Kindness & School',
    subtitle: 'Standing Up Against Cyberbullying',
    themeIcon: '💻',
    playable: false,
    comingSoonText: 'Coming Soon in Expansion Pack — Foster positive online friendships!'
  }
];

export const QUESTS_DATA = {
  // ==========================================
  // LEVEL 1 QUESTS (6 Quests)
  // ==========================================
  quest_groceries: {
    id: 'quest_groceries',
    level: 1,
    title: '1. Groceries for Grandma',
    giver: 'Grandma Evelyn',
    locationHint: "Grandma's Cottage (Northwest)",
    rewardPoints: 25,
    rewardBadge: '🏅 Good Neighbor Badge',
    worldImpact: 'Grandma Evelyn set out blooming flower boxes in front of her cottage!',
    coords: {
      not_started: { x: 350, y: 355, label: "Grandma Evelyn's Cottage" },
      active: { x: 1245, y: 365, label: 'Fresh Mart Pickup Table' },
      ready_to_turn_in: { x: 350, y: 355, label: 'Grandma Evelyn' },
      completed: { x: 350, y: 355, label: "Grandma Evelyn's Cottage" }
    },
    description: 'Grandma Evelyn has aching knees today and needs her weekly groceries picked up from Fresh Mart.',
    objectives: {
      not_started: 'Speak with Grandma Evelyn outside her cottage in the Northwest.',
      active: 'Pick up the Fresh Grocery Basket outside Fresh Mart (Northeast).',
      ready_to_turn_in: 'Deliver the Fresh Grocery Basket back to Grandma Evelyn.',
      completed: 'Delivered groceries! Grandma Evelyn planted colorful flower boxes outside.'
    }
  },
  quest_books: {
    id: 'quest_books',
    level: 1,
    title: '2. Books for Everyone',
    giver: 'Student Maya',
    locationHint: 'Havenwood Library (Southwest)',
    rewardPoints: 30,
    rewardBadge: '📖 Literacy Champion Badge',
    worldImpact: 'A cozy outdoor Community Reading Table opened beside the Havenwood Library!',
    coords: {
      not_started: { x: 350, y: 915, label: 'Student Maya' },
      active: { x: 255, y: 905, label: 'Library Book Stack' },
      ready_to_turn_in: { x: 350, y: 915, label: 'Student Maya' },
      completed: { x: 485, y: 865, label: 'Community Reading Table' }
    },
    description: 'Maya is organizing an outdoor peer reading circle but needs someone to pick up the reserved book stack.',
    objectives: {
      not_started: 'Talk to Student Maya near the Havenwood Library (Southwest).',
      active: 'Collect the Community Book Stack from the west side of the Library.',
      ready_to_turn_in: 'Bring the Community Book Stack to Student Maya.',
      completed: 'Reading circle launched! A cozy outdoor reading nook is now open.'
    }
  },
  quest_garden: {
    id: 'quest_garden',
    level: 1,
    title: '3. A Garden for the Village',
    giver: 'Gardener Rowan',
    locationHint: 'Community Garden (South)',
    rewardPoints: 40,
    rewardBadge: '🌻 Green Thumb Token',
    worldImpact: 'All 3 Community Garden beds are now lush and blooming with golden flowers!',
    coords: {
      not_started: { x: 780, y: 975, label: 'Gardener Rowan' },
      active: { x: 780, y: 885, label: 'Community Garden Beds' },
      ready_to_turn_in: { x: 780, y: 975, label: 'Gardener Rowan' },
      completed: { x: 780, y: 885, label: 'Blooming Community Garden' }
    },
    description: 'The Community Garden soil beds are dry and neglected. Gather seeds and a watering can to restore all 3 beds.',
    objectives: {
      not_started: 'Speak with Gardener Rowan at the Community Garden (South).',
      active: 'Collect the Seed Bag & Watering Can, then plant all 3 soil beds in the garden.',
      ready_to_turn_in: 'Tell Gardener Rowan that all 3 garden beds are planted and watered!',
      completed: 'The Community Garden is now bursting with sunflowers and fresh vegetables!'
    }
  },
  quest_food: {
    id: 'quest_food',
    level: 1,
    title: '4. Food for the Community',
    giver: 'Chef Marco',
    locationHint: 'Community Center (North)',
    rewardPoints: 45,
    rewardBadge: '🍲 Community Table Emblem',
    worldImpact: 'The Community Feast banquet table is now open outside the Community Center!',
    coords: {
      not_started: { x: 780, y: 310, label: 'Chef Marco' },
      active: { x: 680, y: 960, label: 'Garden Veggies & Fresh Mart Bread' },
      ready_to_turn_in: { x: 780, y: 310, label: 'Chef Marco' },
      completed: { x: 780, y: 345, label: 'Community Feast Table' }
    },
    description: 'Chef Marco is preparing a free warm meal for families in Havenwood and needs two food supply crates.',
    objectives: {
      not_started: 'Speak with Chef Marco outside the Community Center (North).',
      active: 'Collect the Harvest Veggie Crate (Garden) and Warm Artisan Loaves (Fresh Mart).',
      ready_to_turn_in: 'Deliver both food supplies to Chef Marco at the Community Center.',
      completed: 'The Community Banquet table is set and neighbors are sharing a warm meal!'
    }
  },
  quest_medicine: {
    id: 'quest_medicine',
    level: 1,
    title: '5. Medicine Delivery',
    giver: 'Nurse Clara',
    locationHint: 'Village Health Clinic (Southeast)',
    rewardPoints: 35,
    rewardBadge: '🩹 Caring Courier Pin',
    worldImpact: 'Mr. Henderson is feeling refreshed and enjoying the breeze at Riverside Park!',
    coords: {
      not_started: { x: 1150, y: 915, label: 'Nurse Clara' },
      active: { x: 1365, y: 555, label: 'Mr. Henderson (Riverside Park)' },
      ready_to_turn_in: { x: 1150, y: 915, label: 'Nurse Clara' },
      completed: { x: 1365, y: 555, label: 'Riverside Park' }
    },
    description: 'The clinic prepared a sealed wellness supply package that needs to be delivered to Mr. Henderson near Riverside Park.',
    objectives: {
      not_started: 'Talk to Nurse Clara at the Village Health Clinic (Southeast).',
      active: 'Pick up the Sealed Wellness Kit at the Clinic and deliver it to Mr. Henderson (East Park).',
      ready_to_turn_in: 'Return to Nurse Clara to confirm Mr. Henderson received his delivery.',
      completed: 'Supplies delivered safely! Mr. Henderson is feeling refreshed at the park.'
    }
  },
  quest_neighbors: {
    id: 'quest_neighbors',
    level: 1,
    title: '6. Bring the Neighbors Together',
    giver: 'Community Notice Board',
    locationHint: 'Havenwood Square (Center)',
    rewardPoints: 50,
    rewardBadge: '🤝 Peacemaker Medallion',
    worldImpact: 'Havenwood Square has been transformed into a welcoming cultural hub for the whole village!',
    coords: {
      not_started: { x: 665, y: 585, label: 'Havenwood Notice Board (Center)' },
      active: { x: 665, y: 585, label: 'Havenwood Notice Board (Center)' },
      ready_to_turn_in: { x: 665, y: 585, label: 'Havenwood Notice Board (Center)' },
      completed: { x: 780, y: 520, label: 'Havenwood Cultural Plaza' }
    },
    description: 'Residents posted competing proposals on the Notice Board for how to use the empty central plaza. Choose a unifying design for the square.',
    objectives: {
      not_started: 'Read the Havenwood Notice Board [R] in the center square to review the plaza proposals.',
      active: 'Select a community design on the Havenwood Notice Board [R].',
      ready_to_turn_in: 'Select a community design on the Havenwood Notice Board [R].',
      completed: 'Harmony restored! Havenwood Square now celebrates everyone in the community.'
    }
  },

  // ==========================================
  // LEVEL 2 QUESTS: CLEAN & GREEN VILLAGE (3 Quests)
  // ==========================================
  quest_sweep_village: {
    id: 'quest_sweep_village',
    level: 2,
    title: '1. Sweep the Village Clean',
    giver: 'Gardener Rowan',
    locationHint: 'Community Garden (South)',
    rewardPoints: 50,
    rewardBadge: '🧹 Golden Broom Badge',
    worldImpact: 'All village walkways are sparkling clean and free of litter!',
    coords: {
      not_started: { x: 780, y: 975, label: 'Gardener Rowan (South)' },
      active: { x: 780, y: 530, label: 'Village Roads (Walk over 8 Trash Piles)' },
      ready_to_turn_in: { x: 780, y: 975, label: 'Gardener Rowan' },
      completed: { x: 780, y: 530, label: 'Sparkling Village Roads' }
    },
    description: 'Last night’s windstorm scattered 8 piles of leaves and litter across the roads. Pick up the Bamboo Broom and walk over all 8 piles to sweep them clean!',
    objectives: {
      not_started: 'Speak with Gardener Rowan at the Community Garden to start the Village Sweep.',
      active: 'Pick up the Bamboo Broom (near Garden) and walk over all 8 Trash/Leaf piles on the roads!',
      ready_to_turn_in: 'Report back to Gardener Rowan that all 8 road piles are swept clean!',
      completed: 'Every road in Havenwood is spotless!'
    }
  },
  quest_recycle_sort: {
    id: 'quest_recycle_sort',
    level: 2,
    title: '2. Park Recycling Drive',
    giver: 'Shopkeeper Leo',
    locationHint: 'Fresh Mart (Northeast)',
    rewardPoints: 45,
    rewardBadge: '♻️ Eco-Sorting Hero',
    worldImpact: 'Color-coded Recycling Bins are now installed outside Fresh Mart!',
    coords: {
      not_started: { x: 1145, y: 365, label: 'Shopkeeper Leo (Northeast)' },
      active: { x: 1350, y: 470, label: 'Riverside Park Recyclables' },
      ready_to_turn_in: { x: 1145, y: 365, label: 'Shopkeeper Leo' },
      completed: { x: 1145, y: 365, label: 'Village Recycling Station' }
    },
    description: 'Help Shopkeeper Leo launch the Zero-Waste initiative by gathering recyclable bottles by the river and sorting them into the new bins.',
    objectives: {
      not_started: 'Talk to Shopkeeper Leo outside Fresh Mart (Northeast).',
      active: 'Collect the Sorted Recyclables bundle near Riverside Park (East).',
      ready_to_turn_in: 'Deliver the Sorted Recyclables to Shopkeeper Leo’s Recycling Station.',
      completed: 'The Village Recycling Station is active and sorting waste!'
    }
  },
  quest_water_saver: {
    id: 'quest_water_saver',
    level: 2,
    title: '3. Save Every Drop',
    giver: 'Nurse Clara',
    locationHint: 'Health Clinic (Southeast)',
    rewardPoints: 45,
    rewardBadge: '💧 Water Guardian Pin',
    worldImpact: 'All leaking outdoor water pipes are fixed, conserving clean water for the village!',
    coords: {
      not_started: { x: 1150, y: 915, label: 'Nurse Clara (Southeast)' },
      active: { x: 520, y: 510, label: '3 Leaking Water Taps along the Paths' },
      ready_to_turn_in: { x: 1150, y: 915, label: 'Nurse Clara' },
      completed: { x: 1150, y: 915, label: 'Health Clinic' }
    },
    description: 'Three outdoor community water taps were left dripping! Walk up to all 3 leaking taps and turn them off to conserve clean water.',
    objectives: {
      not_started: 'Speak with Nurse Clara at the Health Clinic (Southeast).',
      active: 'Find and shut off all 3 leaking blue water taps around the village paths.',
      ready_to_turn_in: 'Let Nurse Clara know all 3 water taps are repaired!',
      completed: 'Zero water wasted! Havenwood’s water supply is protected.'
    }
  },

  // ==========================================
  // LEVEL 3 QUESTS: RESPECTING ELDERS & EMPATHY (3 Quests)
  // ==========================================
  quest_elder_tea: {
    id: 'quest_elder_tea',
    level: 3,
    title: '1. Warm Tea & Respectful Manners',
    giver: 'Grandma Evelyn',
    locationHint: "Grandma's Cottage (Northwest)",
    rewardPoints: 50,
    rewardBadge: '🍵 Respectful Heart Emblem',
    worldImpact: 'Grandma Evelyn and the village elders feel deeply respected and cherished!',
    coords: {
      not_started: { x: 350, y: 355, label: 'Grandma Evelyn (Northwest)' },
      active: { x: 780, y: 310, label: 'Chef Marco (Community Center)' },
      ready_to_turn_in: { x: 350, y: 355, label: 'Grandma Evelyn' },
      completed: { x: 350, y: 355, label: 'Grandma Evelyn' }
    },
    description: 'Practice warm, respectful greetings with Grandma Evelyn and bring her a cup of soothing Chamomile Tea from Chef Marco.',
    objectives: {
      not_started: 'Greet Grandma Evelyn respectfully outside her cottage (Northwest).',
      active: 'Pick up the Warm Chamomile Tea outside the Community Center (North).',
      ready_to_turn_in: 'Serve the Warm Chamomile Tea to Grandma Evelyn with polite manners.',
      completed: 'Shared tea and wisdom with Grandma Evelyn!'
    }
  },
  quest_lost_watch: {
    id: 'quest_lost_watch',
    level: 3,
    title: '2. Listening to Elder Memories',
    giver: 'Mr. Henderson',
    locationHint: 'Riverside Park (East)',
    rewardPoints: 55,
    rewardBadge: '🧭 Heritage Listener Medal',
    worldImpact: 'Mr. Henderson’s family heirloom is restored and his stories are preserved!',
    coords: {
      not_started: { x: 1365, y: 555, label: 'Mr. Henderson (Riverside Park)' },
      active: { x: 430, y: 895, label: 'Havenwood Library Lawn' },
      ready_to_turn_in: { x: 1365, y: 555, label: 'Mr. Henderson' },
      completed: { x: 1365, y: 555, label: 'Riverside Park' }
    },
    description: 'Listen patiently to Mr. Henderson’s story about where he walked this morning, find his lost pocket watch, and return it.',
    objectives: {
      not_started: 'Speak patiently with Mr. Henderson at Riverside Park (East).',
      active: 'Find the Heritage Pocket Watch near the Havenwood Library (Southwest).',
      ready_to_turn_in: 'Return the Heritage Pocket Watch to Mr. Henderson at Riverside Park.',
      completed: 'Returned the family timepiece by listening carefully to an elder!'
    }
  },
  quest_include_newcomer: {
    id: 'quest_include_newcomer',
    level: 3,
    title: '3. No One Left Behind',
    giver: 'Student Maya',
    locationHint: 'Havenwood Library (Southwest)',
    rewardPoints: 60,
    rewardBadge: '🌟 Ambassador of Empathy',
    worldImpact: 'Golden festival lanterns illuminate Havenwood Square as everyone celebrates together!',
    coords: {
      not_started: { x: 350, y: 915, label: 'Student Maya (Southwest)' },
      active: { x: 780, y: 365, label: 'Welcome Banner at Community Center' },
      ready_to_turn_in: { x: 665, y: 585, label: 'Havenwood Notice Board (Square)' },
      completed: { x: 780, y: 520, label: 'Havenwood Golden Lantern Festival' }
    },
    description: 'A shy new student is nervous about joining the village activities. Pick up the Signed Welcome Banner and hang it at the Havenwood Square Notice Board!',
    objectives: {
      not_started: 'Talk to Student Maya by the Library about welcoming the new student.',
      active: 'Pick up the Signed Welcome Banner outside the Community Center (North).',
      ready_to_turn_in: 'Bring the Welcome Banner to the Notice Board [R] in Havenwood Square!',
      completed: 'Everyone is included! Havenwood is glowing with golden festival lanterns!'
    }
  }
};