const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ServiceCenter = require('../models/ServiceCenter');
const Part = require('../models/Part');

/**
 * Reset a user's password safely using bcrypt.
 * Uses direct updateOne with a pre-hashed value to avoid the pre-save hook double-hashing.
 */
const resetUserPassword = async (userId, plainPassword) => {
  const salt = await bcrypt.genSalt(12);
  const hashed = await bcrypt.hash(plainPassword, salt);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        user_password_hash: hashed,
        failedLoginAttempts: 0,
        lockUntil: null,
        user_is_verified: true
      }
    }
  );
};

const seedDatabase = async () => {
  try {
    // 0. Clean up legacy / test users and centers
    await User.deleteMany({
      user_email: { $in: ['owner@example.com', 'admin@example.com', 'center@example.com'] }
    });
    await ServiceCenter.deleteMany({
      $or: [
        { service_center_name: 'Express Car Care' },
        { businessName: 'Express Car Care' }
      ]
    });

    // 1. Seed Owner User
    const ownerEmail = 'alex.owner@autodoc.com';
    let owner = await User.findOne({ user_email: ownerEmail });
    if (!owner) {
      owner = await User.create({
        user_full_name: 'Alex Owner',
        user_email: ownerEmail,
        user_password_hash: 'autodocowner2026',
        user_phone_number: '7777777777',
        user_role: 'owner',
        user_is_verified: true
      });
      console.log(`✅ Seeded Owner User: ${ownerEmail} / autodocowner2026`);
    } else {
      await resetUserPassword(owner._id, 'autodocowner2026');
      console.log(`🔁 Reset Owner User password (${ownerEmail})`);
    }

    // 2. Seed Admin User
    const adminEmail = 'chief.admin@autodoc.com';
    let admin = await User.findOne({ user_email: adminEmail });
    if (!admin) {
      admin = await User.create({
        user_full_name: 'Chief Admin',
        user_email: adminEmail,
        user_password_hash: 'autodocadmin2026',
        user_phone_number: '9999999999',
        user_role: 'admin',
        user_is_verified: true
      });
      console.log(`✅ Seeded Admin User: ${adminEmail} / autodocadmin2026`);
    } else {
      await resetUserPassword(admin._id, 'autodocadmin2026');
      console.log(`🔁 Reset Admin User password (${adminEmail})`);
    }

    // 3. Seed Service Center Manager Users & Profiles
    const serviceCenterAccounts = [
      {
        email: 'sarah.partner@autodoc.com',
        name: 'Sarah Partner',
        phone: '8888888888',
        scId: 'sc-apex-auto-service',
        scName: 'Apex Auto Service'
      },
      {
        email: 'royal@autodoc.com',
        name: 'Royal Motors Manager',
        phone: '9876543211',
        scId: 'sc-royal-motors-kanjirappally',
        scName: 'Royal Motors'
      },
      {
        email: 'sakthi@autodoc.com',
        name: 'Sakthi Tyres Manager',
        phone: '9876543210',
        scId: 'sc-sakthi-tyres-koovapally',
        scName: 'Sakthi Tyres & Auto Care'
      }
    ];

    const SAKTHI_SERVICES = [
      {
        id: 'sakthi-svc-1',
        name: 'Puncture Repair',
        category: 'Maintenance',
        price: '200',
        duration: '45 mins',
        description: 'Tyre punctured — patch or tube repair',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-2',
        name: 'Tyre Replacement / New Tyre Fitting',
        category: 'Maintenance',
        price: '2500',
        duration: '30 mins',
        description: 'Fitting a new tyre, per wheel',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-3',
        name: 'Wheel Alignment',
        category: 'Brakes & Suspension',
        price: '799',
        duration: '40 mins',
        description: 'Adjusting wheel angles for correct tracking',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-4',
        name: 'Wheel Balancing',
        category: 'Brakes & Suspension',
        price: '399',
        duration: '25 mins',
        description: 'Balancing wheel weight to reduce vibration',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-5',
        name: 'Nitrogen Air Filling',
        category: 'Maintenance',
        price: '199',
        duration: '10 mins',
        description: 'Nitrogen top-up, per wheel',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-6',
        name: 'Tyre Rotation',
        category: 'Maintenance',
        price: '599',
        duration: '30 mins',
        description: 'Rotating tyres for even wear',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-7',
        name: 'Old Tyre Buyback/Exchange',
        category: 'Maintenance',
        price: '0',
        duration: '15 mins',
        description: 'Exchange/buyback value applied on new purchase',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-8',
        name: 'Shock Absorber Replacement',
        category: 'Brakes & Suspension',
        price: '3499',
        duration: '90 mins',
        description: 'Replacing worn shock absorbers, per pair',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-9',
        name: 'Suspension Bushing Replacement',
        category: 'Brakes & Suspension',
        price: '1899',
        duration: '60 mins',
        description: 'Replacing worn suspension bushings',
        isAvailable: true
      },
      {
        id: 'sakthi-svc-10',
        name: 'Steering Rack Repair',
        category: 'Brakes & Suspension',
        price: '4999',
        duration: '120 mins',
        description: 'Repair/replacement of steering rack assembly',
        isAvailable: true
      }
    ];

    const APEX_SERVICES = [
      {
        id: 'apex-svc-1',
        name: 'Periodic Synthetic Oil & Filter Change',
        category: 'Maintenance',
        price: '1999',
        duration: '45 mins',
        description: 'Complete replacement of engine oil with synthetic oil, oil filter replacement, and 15-point safety inspection.',
        isAvailable: true
      },
      {
        id: 'apex-svc-2',
        name: 'Full Vehicle Computer OBD-II Diagnostics',
        category: 'Diagnostics',
        price: '899',
        duration: '30 mins',
        description: 'Comprehensive electronic ECU error code scan, sensor health check, and clear warning lights.',
        isAvailable: true
      },
      {
        id: 'apex-svc-3',
        name: 'Complete Engine Tune-up & Spark Plug Service',
        category: 'Engine & Transmission',
        price: '3499',
        duration: '90 mins',
        description: 'Throttle body cleaning, iridium spark plug replacement, air filter swap, and fuel injector check.',
        isAvailable: true
      },
      {
        id: 'apex-svc-4',
        name: 'Brake Pad Inspection & Replacement',
        category: 'Brakes & Suspension',
        price: '2499',
        duration: '60 mins',
        description: 'Front and rear brake caliper cleaning, pad wear check, and OEM replacement brake pad installation.',
        isAvailable: true
      },
      {
        id: 'apex-svc-5',
        name: 'AC System Diagnostics & Gas Recharge',
        category: 'Electrical & AC',
        price: '1799',
        duration: '50 mins',
        description: 'Air conditioning compressor leak test, cabin filter cleanup, and eco-friendly refrigerant top-up.',
        isAvailable: true
      },
      {
        id: 'apex-svc-6',
        name: 'Computerized 3D Wheel Alignment & Balancing',
        category: 'Brakes & Suspension',
        price: '1199',
        duration: '40 mins',
        description: 'Laser wheel alignment, 4-wheel dynamic balancing, and tire tread depth evaluation.',
        isAvailable: true
      },
      {
        id: 'apex-svc-7',
        name: 'Battery Health Test & Terminal Service',
        category: 'Electrical & AC',
        price: '499',
        duration: '20 mins',
        description: 'Battery voltage and cranking amp test, terminal corrosion cleaning, and charging system check.',
        isAvailable: true
      },
      {
        id: 'apex-svc-8',
        name: 'Clutch Plate & Pressure Plate Replacement',
        category: 'Engine & Transmission',
        price: '5999',
        duration: '150 mins',
        description: 'Complete clutch kit replacement including friction plate, release bearing, and flywheel surfacing.',
        isAvailable: true
      },
      {
        id: 'apex-svc-9',
        name: 'Premium Foam Wash & Interior Vacuuming',
        category: 'Detailing & Wash',
        price: '799',
        duration: '60 mins',
        description: 'High-pressure foam exterior wash, dashboard polishing, tire dressing, and deep interior carpet vacuuming.',
        isAvailable: true
      }
    ];

    const ROYAL_SERVICES = [
      {
        id: 'royal-svc-1',
        name: 'Full Engine Overhaul & Gasket Replacement',
        category: 'Engine & Transmission',
        price: '14999',
        duration: '360 mins',
        description: 'Complete engine teardown, cylinder head reconditioning, and head gasket replacement.',
        isAvailable: true
      },
      {
        id: 'royal-svc-2',
        name: 'Transmission Fluid Flush & Gear Inspection',
        category: 'Engine & Transmission',
        price: '2999',
        duration: '60 mins',
        description: 'Automatic/manual transmission fluid drain, flush, filter swap, and gear shifting test.',
        isAvailable: true
      },
      {
        id: 'royal-svc-3',
        name: 'Brake Rotor Refacing & Pad Replacement',
        category: 'Brakes & Suspension',
        price: '3199',
        duration: '75 mins',
        description: 'Brake disc resurfacing to eliminate vibration, plus new ceramic brake pad installation.',
        isAvailable: true
      },
      {
        id: 'royal-svc-4',
        name: 'Periodic Engine Maintenance Service',
        category: 'Maintenance',
        price: '2199',
        duration: '60 mins',
        description: 'Multi-grade engine oil change, oil filter, air filter, and complete underbody check.',
        isAvailable: true
      },
      {
        id: 'royal-svc-5',
        name: 'Exhaust System Repair & Muffler Swap',
        category: 'Engine & Transmission',
        price: '2499',
        duration: '45 mins',
        description: 'Exhaust leak welding, catalytic converter check, and muffler assembly replacement.',
        isAvailable: true
      },
      {
        id: 'royal-svc-6',
        name: 'Fuel Injector Ultrasonic Cleaning',
        category: 'Maintenance',
        price: '1599',
        duration: '50 mins',
        description: 'High-frequency ultrasonic cleaning of fuel injectors for restored mileage and throttle response.',
        isAvailable: true
      },
      {
        id: 'royal-svc-7',
        name: 'Timing Belt / Chain Replacement',
        category: 'Engine & Transmission',
        price: '4599',
        duration: '120 mins',
        description: 'Timing belt/chain kit installation, tensioner pulley swap, and engine synchronization.',
        isAvailable: true
      },
      {
        id: 'royal-svc-8',
        name: 'Alternator & Starter Motor Overhaul',
        category: 'Electrical & AC',
        price: '2299',
        duration: '60 mins',
        description: 'Alternator voltage regulator replacement, armature cleaning, and starter solenoid repair.',
        isAvailable: true
      }
    ];

    const HEAVY_DUTY_SERVICES = [
      {
        id: 'heavy-svc-1',
        name: 'Commercial Heavy Diesel Engine Tuning',
        category: 'Engine & Transmission',
        price: '6999',
        duration: '120 mins',
        description: 'Heavy diesel turbocharger inspection, fuel pump calibration, and commercial engine tuning.',
        isAvailable: true
      },
      {
        id: 'heavy-svc-2',
        name: 'Heavy Duty Air Brake System Servicing',
        category: 'Brakes & Suspension',
        price: '3999',
        duration: '90 mins',
        description: 'Commercial air compressor check, moisture dryer overhaul, and heavy brake shoe replacement.',
        isAvailable: true
      },
      {
        id: 'heavy-svc-3',
        name: 'Multi-Axle Wheel Alignment & Chassis Inspection',
        category: 'Brakes & Suspension',
        price: '2499',
        duration: '60 mins',
        description: 'Heavy truck and bus multi-axle laser alignment and frame crack inspection.',
        isAvailable: true
      },
      {
        id: 'heavy-svc-4',
        name: 'Commercial Vehicle Clutch & Flywheel Overhaul',
        category: 'Engine & Transmission',
        price: '8999',
        duration: '180 mins',
        description: 'Heavy commercial clutch disc replacement, booster check, and flywheel grinding.',
        isAvailable: true
      },
      {
        id: 'heavy-svc-5',
        name: 'Heavy Truck Oil & Filter Service',
        category: 'Maintenance',
        price: '4499',
        duration: '60 mins',
        description: 'High-capacity heavy diesel engine oil drain (15L+), dual oil filter replacement, and greasing.',
        isAvailable: true
      },
      {
        id: 'heavy-svc-6',
        name: 'Leaf Spring Repair & Heavy Suspension Overhaul',
        category: 'Brakes & Suspension',
        price: '5499',
        duration: '150 mins',
        description: 'Heavy leaf spring re-cambering, pin replacement, and heavy shock absorber installation.',
        isAvailable: true
      }
    ];

    const SPEEDY_LUBE_SERVICES = [
      {
        id: 'speedy-svc-1',
        name: 'Express 15-Minute Synthetic Oil Change',
        category: 'Maintenance',
        price: '1499',
        duration: '15 mins',
        description: 'Super-fast synthetic engine oil change and genuine spin-on oil filter swap while you wait.',
        isAvailable: true
      },
      {
        id: 'speedy-svc-2',
        name: 'Fluid Level Top-Up & Multi-Point Inspection',
        category: 'Maintenance',
        price: '299',
        duration: '10 mins',
        description: 'Brake fluid, coolant, power steering, and windshield washer fluid inspection and top-up.',
        isAvailable: true
      },
      {
        id: 'speedy-svc-3',
        name: 'Cabin & Engine Air Filter Replacement',
        category: 'Maintenance',
        price: '699',
        duration: '15 mins',
        description: 'Engine air intake filter swap and activated carbon cabin air filter installation.',
        isAvailable: true
      },
      {
        id: 'speedy-svc-4',
        name: 'Wiper Blade Replacement & Washer Service',
        category: 'Maintenance',
        price: '399',
        duration: '10 mins',
        description: 'Frameless silicone wiper blade installation and spray nozzle unblocking.',
        isAvailable: true
      },
      {
        id: 'speedy-svc-5',
        name: 'Quick Brake Safety Check & Fluid Flush',
        category: 'Brakes & Suspension',
        price: '899',
        duration: '25 mins',
        description: 'Brake pad thickness measurement, rotor condition check, and DOT4 fluid reservoir flush.',
        isAvailable: true
      },
      {
        id: 'speedy-svc-6',
        name: 'Express Car Wash & Vacuum',
        category: 'Detailing & Wash',
        price: '499',
        duration: '20 mins',
        description: 'Rapid exterior body wash, microfiber dry, and quick cabin floor vacuuming.',
        isAvailable: true
      }
    ];

    const GREEN_EV_SERVICES = [
      {
        id: 'ev-svc-1',
        name: 'High-Voltage EV Battery Pack Diagnostics & Balance',
        category: 'Electrical & AC',
        price: '2999',
        duration: '60 mins',
        description: 'Lithium battery cell voltage balancing, state of health (SoH) assessment, and thermal test.',
        isAvailable: true
      },
      {
        id: 'ev-svc-2',
        name: 'EV Motor & Thermal Management Inspection',
        category: 'Diagnostics',
        price: '1999',
        duration: '45 mins',
        description: 'Electric traction motor insulation check, coolant pump test, and inverter health diagnostic.',
        isAvailable: true
      },
      {
        id: 'ev-svc-3',
        name: 'Regenerative Braking System Calibration',
        category: 'Brakes & Suspension',
        price: '1499',
        duration: '40 mins',
        description: 'Software calibration of regen braking sensors and physical brake disc/pad cleaning.',
        isAvailable: true
      },
      {
        id: 'ev-svc-4',
        name: 'EV Charging Port & Onboard Charger Repair',
        category: 'Electrical & AC',
        price: '2499',
        duration: '50 mins',
        description: 'CCS2 / Type 2 charging inlet pin cleaning, latch solenoid check, and onboard AC charger testing.',
        isAvailable: true
      },
      {
        id: 'ev-svc-5',
        name: 'EV Cabin Heat-Pump AC & Air Filter Service',
        category: 'Electrical & AC',
        price: '1699',
        duration: '45 mins',
        description: 'Electric AC heat-pump servicing, HEPA cabin filter replacement, and antibacterial wash.',
        isAvailable: true
      },
      {
        id: 'ev-svc-6',
        name: 'EV Tyre Wear & Low Rolling Resistance Alignment',
        category: 'Brakes & Suspension',
        price: '899',
        duration: '35 mins',
        description: 'Precision wheel alignment optimized for heavy EV torque and low rolling resistance tires.',
        isAvailable: true
      }
    ];

    for (const acc of serviceCenterAccounts) {
      let centerUser = await User.findOne({ user_email: acc.email });
      if (!centerUser) {
        centerUser = await User.create({
          user_full_name: acc.name,
          user_email: acc.email,
          user_password_hash: 'autodocpartner2026',
          user_phone_number: acc.phone,
          user_role: 'service_center',
          user_is_verified: true
        });
        console.log(`✅ Seeded Service Center User: ${acc.email} / autodocpartner2026`);
      } else {
        await resetUserPassword(centerUser._id, 'autodocpartner2026');
        centerUser = await User.findOne({ user_email: acc.email });
        console.log(`🔁 Reset Service Center User password (${acc.email})`);
      }

      let sc = await ServiceCenter.findOne({
        $or: [{ user_id: centerUser._id }, { serviceCenterId: acc.scId }, { service_center_name: acc.scName }]
      });

      if (sc) {
        const setPayload = {
          user_id: centerUser._id,
          approvalStatus: 'approved',
          status: 'approved',
          service_center_is_verified: true
        };

        if (acc.scId === 'sc-apex-auto-service') {
          setPayload.servicesOffered = APEX_SERVICES;
        } else if (acc.scId === 'sc-royal-motors-kanjirappally') {
          setPayload.servicesOffered = ROYAL_SERVICES;
        } else if (acc.scId === 'sc-sakthi-tyres-koovapally' || acc.scName.includes('Sakthi')) {
          setPayload.servicesOffered = SAKTHI_SERVICES;
        }

        await ServiceCenter.updateOne(
          { _id: sc._id },
          { $set: setPayload }
        );
      }
    }

    // Also update remaining seeded centers (Heavy Duty, Speedy Lube, GreenEV)
    await ServiceCenter.updateOne(
      { serviceCenterId: 'sc-heavy-duty-palai' },
      { $set: { servicesOffered: HEAVY_DUTY_SERVICES, approvalStatus: 'approved', status: 'approved' } }
    );
    await ServiceCenter.updateOne(
      { serviceCenterId: 'sc-speedy-lube-thiruvalla' },
      { $set: { servicesOffered: SPEEDY_LUBE_SERVICES, approvalStatus: 'approved', status: 'approved' } }
    );
    await ServiceCenter.updateOne(
      { serviceCenterId: 'sc-green-ev-changanassery' },
      { $set: { servicesOffered: GREEN_EV_SERVICES, approvalStatus: 'approved', status: 'approved' } }
    );

    // 4. Seed Parts Catalog
    const partsSeedPath = path.join(__dirname, '../data/parts-seed.json');
    if (fs.existsSync(partsSeedPath)) {
      try {
        const partsData = JSON.parse(fs.readFileSync(partsSeedPath, 'utf8'));
        const apexSc = await ServiceCenter.findOne({ serviceCenterId: 'sc-apex-auto-service' });
        const partsToInsert = partsData.map(p => ({
          ...p,
          serviceCenter: apexSc ? apexSc._id : null
        }));

        await Part.deleteMany({});
        await Part.insertMany(partsToInsert);
        console.log(`✅ Seeded ${partsToInsert.length} parts with image URLs into the Parts Catalog.`);
      } catch (fileErr) {
        console.error('❌ Failed to parse or insert parts-seed.json:', fileErr.message);
      }
    }

    console.log('\n📋 Login Credentials:');
    console.log('   Owner:               alex.owner@autodoc.com     / autodocowner2026');
    console.log('   Admin:               chief.admin@autodoc.com    / autodocadmin2026');
    console.log('   Royal Motors:        royal@autodoc.com          / autodocpartner2026');
    console.log('   Sakthi Tyres:        sakthi@autodoc.com         / autodocpartner2026');
    console.log('   Apex Auto Service:   sarah.partner@autodoc.com  / autodocpartner2026\n');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
  }
};

module.exports = seedDatabase;
