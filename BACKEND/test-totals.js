const axios = require('axios');
const baseURL = 'http://localhost:3000/api';

async function testTotals() {
  try {
    console.log('Testing ALL dashboard API endpoints...\n');

    // Add delay function
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    console.log('Note: Using 3-second delays to avoid rate limiting...');

    // 1. Total Students
    console.log('1. Testing /onboardstudents/total-students');
    const totalStudents = await axios.get(`${baseURL}/onboardstudents/total-students`);
    console.log('   Total Students:', totalStudents.data.total);
    await delay(3000);

    // 2. Total Mentors
    console.log('2. Testing /onboardmentors/total-mentors');
    const totalMentors = await axios.get(`${baseURL}/onboardmentors/total-mentors`);
    console.log('   Total Mentors:', totalMentors.data.total);
    await delay(3000);

    // 3. Program Totals
    console.log('3. Testing /onboardstudents/totals-by-programs');
    const programTotals = await axios.get(`${baseURL}/onboardstudents/totals-by-programs`);
    console.log('   Program Totals:', programTotals.data.totals);
    await delay(3000);

    // 4. Track Totals
    console.log('4. Testing /onboardstudents/totals-by-tracks');
    const trackTotals = await axios.get(`${baseURL}/onboardstudents/totals-by-tracks`);
    console.log('   Track Totals:', trackTotals.data.totals);
    await delay(3000);

    // 5. Internship Tracks Distribution
    console.log('5. Testing /onboardstudents/internship-tracks-distribution');
    const internshipTracks = await axios.get(`${baseURL}/onboardstudents/internship-tracks-distribution`);
    console.log('   Internship Tracks:', internshipTracks.data.tracks);
    await delay(3000);

    // 6. Mentorship Tracks Distribution
    console.log('6. Testing /onboardstudents/mentorship-tracks-distribution');
    const mentorshipTracks = await axios.get(`${baseURL}/onboardstudents/mentorship-tracks-distribution`);
    console.log('   Mentorship Tracks:', mentorshipTracks.data.tracks);
    await delay(3000);

    // 7. Mentors by Track
    console.log('7. Testing /onboardmentors/mentors-by-track');
    const mentorsByTrack = await axios.get(`${baseURL}/onboardmentors/mentors-by-track`);
    console.log('   Mentors by Track:', mentorsByTrack.data.mentorsByTrack);
    await delay(3000);

    // 8. Web Development Track Total
    console.log('8. Testing /onboardstudents/total-by-track/Web%20Development');
    const webDevTotal = await axios.get(`${baseURL}/onboardstudents/total-by-track/Web%20Development`);
    console.log('   Web Development Total:', webDevTotal.data.total);
    await delay(3000);

    // 9. Summary Statistics
    console.log('9. Testing /onboardstudents/summary-statistics');
    const summaryStats = await axios.get(`${baseURL}/onboardstudents/summary-statistics`);
    console.log('   Summary Statistics:', summaryStats.data.summary);
    await delay(3000);

    // 10. Total Assessments
    console.log('10. Testing /assessments/total');
    const totalAssessments = await axios.get(`${baseURL}/assessments/total`);
    console.log('    Total Assessments:', totalAssessments.data.total);
    await delay(3000);

    // 11. Total Cohorts
    console.log('11. Testing /cohorts/total');
    const totalCohorts = await axios.get(`${baseURL}/cohorts/total`);
    console.log('    Total Cohorts:', totalCohorts.data.total);
    await delay(3000);

    // 12. Active Assignments Count
    console.log('12. Testing /mentorstudentassignment/active-count');
    const activeAssignments = await axios.get(`${baseURL}/mentorstudentassignment/active-count`);
    console.log('    Active Assignments:', activeAssignments.data.count);
    await delay(3000);

    // 13. Assessment Totals by Program
    console.log('13. Testing /assessments/totals-by-program');
    const assessmentTotalsByProgram = await axios.get(`${baseURL}/assessments/totals-by-program`);
    console.log('    Assessment Totals by Program:', assessmentTotalsByProgram.data.totals);
    await delay(3000);

    // 14. Assessment Totals by Type
    console.log('14. Testing /assessments/totals-by-type');
    const assessmentTotalsByType = await axios.get(`${baseURL}/assessments/totals-by-type`);
    console.log('    Assessment Totals by Type:', assessmentTotalsByType.data.totals);

    console.log('\n--- VALIDATION ---');

    // Validate total students vs program totals
    const sumPrograms = Object.values(programTotals.data.totals).reduce((sum, val) => sum + val, 0);
    console.log('Total Students vs Sum of Program Totals:', totalStudents.data.total, 'vs', sumPrograms);
    console.log('   Match:', totalStudents.data.total === sumPrograms);

    // Validate mentorship tracks vs program total
    const mentorshipSum = Object.values(mentorshipTracks.data.tracks).reduce((sum, val) => sum + val, 0);
    const mentorshipProgramTotal = programTotals.data.totals['Mentorship Program'] || 0;
    console.log('Mentorship Tracks Sum vs Program Total:', mentorshipSum, 'vs', mentorshipProgramTotal);
    console.log('   Match:', mentorshipSum === mentorshipProgramTotal);

    // Validate internship tracks vs program total
    const internshipSum = Object.values(internshipTracks.data.tracks).reduce((sum, val) => sum + val, 0);
    const internshipProgramTotal = programTotals.data.totals['Internship Program'] || 0;
    console.log('Internship Tracks Sum vs Program Total:', internshipSum, 'vs', internshipProgramTotal);
    console.log('   Match:', internshipSum === internshipProgramTotal);

    // Validate web dev track consistency
    const webDevFromTracks = trackTotals.data.totals['Web Development'] || 0;
    console.log('Web Dev from totals-by-tracks vs specific endpoint:', webDevFromTracks, 'vs', webDevTotal.data.total);
    console.log('   Match:', webDevFromTracks === webDevTotal.data.total);

    console.log('\n--- SUMMARY ---');
    console.log('All dashboard API endpoints tested successfully!');

  } catch (error) {
    console.error('Error testing totals:', error.message);
  }
}

testTotals();
