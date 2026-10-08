import prisma from "../src/utils/prisma.js";

type SeedCoachData = {
  trainId: number;
  coachNumber: string;
  coachType: "GENERAL" | "SLEEPER" | "AC" | "CHAIR_CAR";
  totalSeats: number;
  fare: number;
};

function getTravelDate(daysFromToday: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getTime(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

async function ensureCoach(coachData: SeedCoachData) {
  const existingCoach = await prisma.coach.findFirst({
    where: {
      trainId: coachData.trainId,
      coachNumber: coachData.coachNumber,
    },
  });

  if (existingCoach) {
    if (existingCoach.fare === null) {
      return prisma.coach.update({
        where: { id: existingCoach.id },
        data: { fare: coachData.fare },
      });
    }

    return existingCoach;
  }

  return prisma.coach.create({ data: coachData });
}

async function ensureRoute(routeData: {
  trainId: number;
  sourceStationId: number;
  destinationStationId: number;
  departureTime: Date;
  arrivalTime: Date;
}) {
  const existingRoute = await prisma.route.findFirst({
    where: routeData,
  });

  if (!existingRoute) {
    await prisma.route.create({ data: routeData });
  }
}

async function ensureAvailability(
  coachId: number,
  travelDate: Date,
  availableSeats: number,
) {
  const existingAvailability = await prisma.seatAvailability.findFirst({
    where: { coachId, travelDate },
  });

  if (!existingAvailability) {
    await prisma.seatAvailability.create({
      data: { coachId, travelDate, availableSeats },
    });
  }
}

async function main() {
  const [newDelhi, mumbaiCentral, pune, jaipur, ahmedabad] = await Promise.all([
    prisma.station.upsert({
      where: { code: "NDLS" },
      update: { name: "New Delhi", city: "New Delhi", state: "Delhi" },
      create: { name: "New Delhi", code: "NDLS", city: "New Delhi", state: "Delhi" },
    }),
    prisma.station.upsert({
      where: { code: "MMCT" },
      update: { name: "Mumbai Central", city: "Mumbai", state: "Maharashtra" },
      create: {
        name: "Mumbai Central",
        code: "MMCT",
        city: "Mumbai",
        state: "Maharashtra",
      },
    }),
    prisma.station.upsert({
      where: { code: "PUNE" },
      update: { name: "Pune", city: "Pune", state: "Maharashtra" },
      create: { name: "Pune", code: "PUNE", city: "Pune", state: "Maharashtra" },
    }),
    prisma.station.upsert({
      where: { code: "JP" },
      update: { name: "Jaipur", city: "Jaipur", state: "Rajasthan" },
      create: { name: "Jaipur", code: "JP", city: "Jaipur", state: "Rajasthan" },
    }),
    prisma.station.upsert({
      where: { code: "ADI" },
      update: { name: "Ahmedabad", city: "Ahmedabad", state: "Gujarat" },
      create: {
        name: "Ahmedabad",
        code: "ADI",
        city: "Ahmedabad",
        state: "Gujarat",
      },
    }),
  ]);

  const [mumbaiRajdhani, ahmedabadRajdhani, puneJaipurExpress] =
    await Promise.all([
      prisma.train.upsert({
        where: { trainNumber: "12951" },
        update: { name: "Mumbai Rajdhani Express" },
        create: { trainNumber: "12951", name: "Mumbai Rajdhani Express" },
      }),
      prisma.train.upsert({
        where: { trainNumber: "12957" },
        update: { name: "Swarna Jayanti Rajdhani Express" },
        create: {
          trainNumber: "12957",
          name: "Swarna Jayanti Rajdhani Express",
        },
      }),
      prisma.train.upsert({
        where: { trainNumber: "12939" },
        update: { name: "Pune Jaipur Superfast Express" },
        create: { trainNumber: "12939", name: "Pune Jaipur Superfast Express" },
      }),
    ]);

  await Promise.all([
    ensureRoute({
      trainId: mumbaiRajdhani.id,
      sourceStationId: mumbaiCentral.id,
      destinationStationId: newDelhi.id,
      departureTime: getTime("16:00"),
      arrivalTime: getTime("08:30"),
    }),
    ensureRoute({
      trainId: ahmedabadRajdhani.id,
      sourceStationId: ahmedabad.id,
      destinationStationId: newDelhi.id,
      departureTime: getTime("18:30"),
      arrivalTime: getTime("06:00"),
    }),
    ensureRoute({
      trainId: puneJaipurExpress.id,
      sourceStationId: pune.id,
      destinationStationId: jaipur.id,
      departureTime: getTime("17:30"),
      arrivalTime: getTime("14:00"),
    }),
  ]);

  const coaches = await Promise.all([
    ensureCoach({
      trainId: mumbaiRajdhani.id,
      coachNumber: "1A",
      coachType: "AC",
      totalSeats: 72,
      fare: 2500,
    }),
    ensureCoach({
      trainId: mumbaiRajdhani.id,
      coachNumber: "S1",
      coachType: "SLEEPER",
      totalSeats: 72,
      fare: 900,
    }),
    ensureCoach({
      trainId: ahmedabadRajdhani.id,
      coachNumber: "1A",
      coachType: "AC",
      totalSeats: 72,
      fare: 2200,
    }),
    ensureCoach({
      trainId: ahmedabadRajdhani.id,
      coachNumber: "S1",
      coachType: "SLEEPER",
      totalSeats: 72,
      fare: 800,
    }),
    ensureCoach({
      trainId: puneJaipurExpress.id,
      coachNumber: "C1",
      coachType: "CHAIR_CAR",
      totalSeats: 78,
      fare: 1400,
    }),
    ensureCoach({
      trainId: puneJaipurExpress.id,
      coachNumber: "S1",
      coachType: "SLEEPER",
      totalSeats: 72,
      fare: 850,
    }),
  ]);

  for (let daysFromToday = 1; daysFromToday <= 30; daysFromToday++) {
    const travelDate = getTravelDate(daysFromToday);

    for (const coach of coaches) {
      await ensureAvailability(
        coach.id,
        travelDate,
        Math.max(coach.totalSeats - 10, 0),
      );
    }
  }

  console.log("Seed complete: stations, trains, routes, coaches, and availability are ready.");
}

main()
  .catch(() => {
    console.error("Database seeding failed. Check the connection and seed data.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });