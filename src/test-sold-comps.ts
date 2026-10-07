import { getSoldComps } from "./sold-comps";

async function testSoldComps() {
  try {
    const city = "Beverly Hills";

    console.log(`Sold comps for ${city}:`);

    const comps = await getSoldComps(city, 12);

    console.log(`Found ${comps.length} sold properties:`);
    console.log(comps.slice(0, 10));
  } catch (error) {
    console.error("Sold comps search failed:");
    console.error(error);
  }
}

testSoldComps();
