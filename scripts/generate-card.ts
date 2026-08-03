import { generateCard } from "../src/lib/fact-card";

const count = Number(process.argv[2]) || 1;

for (let i = 0; i < count; i++) {
  console.log(`\n🔎 Startup Card ${i + 1}`);
  for (const line of generateCard()) console.log(`- ${line}`);
}
