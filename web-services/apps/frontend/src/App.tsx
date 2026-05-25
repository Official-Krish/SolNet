import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import Landing from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { RentVM } from './pages/RentVm'
import { VMDetails } from './pages/vmDetail'
import { Hosting } from './pages/Hosting'
import { SignUp } from './pages/Signup'
import '@solana/wallet-adapter-react-ui/styles.css';
import { SignIn } from './pages/Signin';
import SSHTerminal from './pages/Terminal'
import { AdminPage } from './pages/Admin'
import { ComingSoon } from './components/ComingSoon'
import { HostRegister } from './pages/HostMachine'
import { HostDashboard } from './pages/HostDashboard'
import { DeployApp } from './pages/deployImage'

function App() {
  return (
    <>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing/>} />
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/rent" element={<RentVM/>} />
            <Route path="/vm/:id" element={<VMDetails/>} />
            <Route path="/hosting" element={<Hosting/>} />
            <Route path="/signup" element={<SignUp/>} />
            <Route path="/signin" element={<SignIn/>} />
            <Route path="/ssh/:id" element={<SSHTerminal/>} />
            <Route path="/admin" element={<AdminPage/>} />
            <Route path="/depin/register" element={<HostRegister/>} />
            <Route path="/depin/host/dashboard" element={<HostDashboard/>} />
            <Route path="/depin/deploy" element={<DeployApp/>} />
            <Route path="*" element={<ComingSoon isDepin={false}/>} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </>
  )
}

export default App
