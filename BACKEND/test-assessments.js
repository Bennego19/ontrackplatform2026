import db from './db/conn.mjs';

async function testAssessments() {
  try {
    console.log('Testing assessments database...');

    const assessments = await db.collection('assessments').find({}).toArray();
    console.log('Total assessments in database:', assessments.length);

    if (assessments.length > 0) {
      console.log('Sample assessment:', JSON.stringify(assessments[0], null, 2));

      // Check by program
      const byProgram = {};
      assessments.forEach(a => {
        const prog = a.program || 'no-program';
        byProgram[prog] = (byProgram[prog] || 0) + 1;
      });
      console.log('Assessments by program:', byProgram);
    } else {
      console.log('No assessments found in database');
    }

    // Check admins collection
    const admins = await db.collection('admins').find({}).toArray();
    console.log('Total admins in database:', admins.length);
    if (admins.length > 0) {
      console.log('Sample admin:', JSON.stringify(admins[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testAssessments();
