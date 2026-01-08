import logo from './logo.svg';

import { Route, Routes } from 'react-router-dom';
import SignUp from "./components/signup";
import SignIn from "./components/signin";
import Dashboard from './components/dashboard';
import AdminLogin from './components/adminlogin';
import CreateMentor from './components/creatementor';
import Createassessment from './components/createassessment';
import StudentAssignment from './components/studentassignment';
import OnboardStudent from './components/onboardstudent';
import OnboardMentor from './components/onboardmentor';
import AssignMentor from './components/mentorassignment';
import Managementorship from './components/managementorship';
import ManageInternship from './components/manageinternship';
import ManageSkillDevelopment from './components/manageskilldevelopment';
import ManageGraduate from './components/managegraduate';
import Userdashboard from './components/userdashboard';
import MentorDashboard from './components/mentordashboard';
import ManageResources from './components/manageresources';
import AdminAnnouncements from './components/AdminAnnouncements';
import Notices from './components/Notices';
import Events from './components/events';
import HelpRequests from './components/HelpRequests';
const App = ()=> {
  return (
    <div>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<AdminLogin />} />

        <Route path="/SignIn" element={<Userdashboard />} />
        <Route path="/SignUp" element={<SignUp />} />
         <Route path="/userdashboard" element={<Userdashboard />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/CreateMentor" element={<CreateMentor />} />
        <Route path="/Createassessment" element={<Createassessment />} />
        <Route path="/studentassignment" element={<StudentAssignment />} />
        <Route path="/onboardstudent" element={<OnboardStudent />} />
        <Route path="/onboardmentor" element={<OnboardMentor />} />
        <Route path="/assignmentor" element={<AssignMentor />} />
        <Route path="/managementorship" element={<Managementorship/>}/>
        <Route path="/manageinternship" element={<ManageInternship/>}/>
        <Route path="/manageskilldevelopment" element={<ManageSkillDevelopment/>}/>
        <Route path="/managegraduate" element={<ManageGraduate/>}/>
        <Route path="/mentordashboard" element={<MentorDashboard/>}/>
        <Route path="/resources" element={<ManageResources/>}/>
          <Route path="/announcements" element={<AdminAnnouncements/>} />
          <Route path="/notices" element={<Notices/>} />
          <Route path="/help-requests" element={<HelpRequests/>} />
          <Route path="/events" element={<Events/>} />
</Routes>
    </div>
  );
}

export default App;
