import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { RentVM } from "./pages/RentVm";
import { VMDetails } from "./pages/vmDetail";
import { Hosting } from "./pages/Hosting";
import { SignUp } from "./pages/Signup";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SignIn } from "./pages/Signin";
import SSHTerminal from "./pages/Terminal";
import { AdminPage } from "./pages/Admin";
import { ComingSoon } from "./components/ComingSoon";
import { HostRegister } from "./pages/HostMachine";
import { DepinDeployment } from "./pages/DepinDeployment";
import { HostDashboard } from "./pages/HostDashboard";
import { DeployApp } from "./pages/deployImage";
import { HostMachineDetails } from "./pages/HostMachineDetails";
import Docs from "./pages/Docs";
import ApiReference from "./pages/ApiReference";
import Tutorials from "./pages/Tutorials";
import Status from "./pages/Status";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import { Privacy, Terms, Cookies, GDPR } from "./pages/Legal";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import Notifications from "./pages/Notifications";
import FAQ from "./pages/FAQ";
import Roadmap from "./pages/Roadmap";
import ClaimRewards from "./pages/ClaimRewards";
import Host from "./pages/Host";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rent" element={<RentVM />} />
        <Route path="/vm/:id" element={<VMDetails />} />
        <Route path="/hosting" element={<Hosting />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/ssh/:id" element={<SSHTerminal />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/depin/register" element={<HostRegister />} />
        <Route path="/depin/host/dashboard" element={<HostDashboard />} />
        <Route path="/docker/deploy" element={<DeployApp />} />
        <Route path="/depin/machine/:id" element={<HostMachineDetails />} />
        <Route path="/depin/deployment/:id" element={<DepinDeployment />} />
        <Route path="/depin/rewards" element={<ClaimRewards />} />
        <Route path="/host" element={<Host />} />

        <Route path="/docs" element={<Docs />} />
        <Route path="/api" element={<ApiReference />} />
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/status" element={<Status />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/gdpr" element={<GDPR />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="*" element={<ComingSoon isDepin={false} />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
