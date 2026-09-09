import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import SignUp from "./components/Register";
import Dashboard from "./components/Dashboard";
import Patients from "./components/Patients";
import Appointments from "./components/Appointments";
import Reception from "./components/Reception";
import Queue from "./components/Queue";
import MedicalRecords from "./components/MedicalRecords";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import Admin from "./components/Admin";
import HrVacancies from "./components/HrVacancies";
import HrStaffing from "./components/HrStaffing";
import HrDoctors from "./components/HrDoctors";
import HrDashboard from "./components/hr/HrDashboard";
import HrRecruitment from "./components/hr/HrRecruitment";
import HrEmployees from "./components/hr/HrEmployees";
import HrLeave from "./components/hr/HrLeave";
import HrTraining from "./components/hr/HrTraining";
import HrReports from "./components/hr/HrReports";
import HrUsers from "./components/hr/HrUsers";
import SurgicalWaitlist from "./components/SurgicalWaitlist";
import PharmacyDashboard from "./components/pharmacy/PharmacyDashboard";
import PharmacyOperations from "./components/pharmacy/PharmacyOperations";
import PharmacyClinical from "./components/pharmacy/PharmacyClinical";
import PharmacyFinance from "./components/pharmacy/PharmacyFinance";
import PharmacyInventory from "./components/pharmacy/PharmacyInventory";
import PharmacyDispense from "./components/pharmacy/PharmacyDispense";
import PharmacyUsers from "./components/pharmacy/PharmacyUsers";
import Complaints from "./components/Complaints";
import SmsReminders from "./components/SmsReminders";
import TheatreUtilisation from "./components/TheatreUtilisation";
import Finance from "./components/Finance";
import FinanceDashboard from "./components/finance/FinanceDashboard";
import FinanceBilling from "./components/finance/FinanceBilling";
import FinanceProcurement from "./components/finance/FinanceProcurement";
import FinanceBudget from "./components/finance/FinanceBudget";
import FinanceAccounting from "./components/finance/FinanceAccounting";
import FinanceIrregular from "./components/finance/FinanceIrregular";
import FinanceUsers from "./components/finance/FinanceUsers";
import PayrollDashboard from "./components/payroll/PayrollDashboard";
import PayrollCosts from "./components/payroll/PayrollCosts";
import PayrollTimesheets from "./components/payroll/PayrollTimesheets";
import PayrollGhostCases from "./components/payroll/PayrollGhostCases";
import PayrollCompliance from "./components/payroll/PayrollCompliance";
import PayrollAudit from "./components/payroll/PayrollAudit";
import PayrollReports from "./components/payroll/PayrollReports";
import PayrollUsers from "./components/payroll/PayrollUsers";
import ProcurementDashboard from "./components/procurement/ProcurementDashboard";
import ProcurementTenders from "./components/procurement/ProcurementTenders";
import ProcurementBids from "./components/procurement/ProcurementBids";
import ProcurementSuppliers from "./components/procurement/ProcurementSuppliers";
import ProcurementContracts from "./components/procurement/ProcurementContracts";
import ProcurementSpend from "./components/procurement/ProcurementSpend";
import ProcurementLedger from "./components/procurement/ProcurementLedger";
import ProcurementAlerts from "./components/procurement/ProcurementAlerts";
import ProcurementInsights from "./components/procurement/ProcurementInsights";
import ProcurementReports from "./components/procurement/ProcurementReports";
import ProcurementUsers from "./components/procurement/ProcurementUsers";
import ReportingExports from "./components/ReportingExports";
import AuditTrail from "./components/AuditTrail";
import PmdsSupervision from "./components/PmdsSupervision";
import MonitoringKpis from "./components/MonitoringKpis";
import Chat from "./components/Chat";
import Home from "./components/Home";
import PatientOnboarding from "./components/PatientOnboarding";
import PatientDashboard from "./components/PatientDashboard";
import PatientAppointments from "./components/patient/PatientAppointments";
import PatientMedications from "./components/patient/PatientMedications";
import PatientRecords from "./components/patient/PatientRecords";
import PatientNotifications from "./components/patient/PatientNotifications";
import PatientFeedback from "./components/patient/PatientFeedback";
import PatientProfile from "./components/patient/PatientProfile";
import PatientSupport from "./components/patient/PatientSupport";
import DoctorDashboard from "./components/doctor/DoctorDashboard";
import DoctorQueue from "./components/doctor/DoctorQueue";
import DoctorConsult from "./components/doctor/DoctorConsult";
import DoctorOrders from "./components/doctor/DoctorOrders";
import DoctorReferrals from "./components/doctor/DoctorReferrals";
import DoctorNotes from "./components/doctor/DoctorNotes";
import DoctorSchedule from "./components/doctor/DoctorSchedule";
import DoctorGovernance from "./components/doctor/DoctorGovernance";
import DoctorProfile from "./components/doctor/DoctorProfile";
import SuperAdminCms from "./components/SuperAdminCms";
import { getRole, getToken } from "./auth";

function homeForRole(role) {
  if (role === "super_admin") return "/cms";
  if (role === "hr") return "/hr";
  if (role === "finance") return "/finance";
  if (role === "payroll") return "/payroll";
  if (role === "procurement") return "/procurement";
  if (role === "pharmacy") return "/pharmacy";
  if (role === "patient") return "/patient/dashboard";
  if (role === "doctor") return "/doctor";
  return "/admin";
}

/**
 * Guards staff routes by role. Token presence is enough for now
 * (JWT is not decoded client-side; API enforces validity).
 */
function RoleRoute({ roles, children }) {
  const token = getToken();
  const role = getRole();

  if (!token) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/dashboard"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <Patients />
            </RoleRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <Appointments />
            </RoleRoute>
          }
        />
        <Route
          path="/reception"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <Reception />
            </RoleRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <Queue />
            </RoleRoute>
          }
        />
        <Route
          path="/records"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <MedicalRecords />
            </RoleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <Reports />
            </RoleRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleRoute roles={["admin"]}>
              <Settings />
            </RoleRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <Chat />
            </RoleRoute>
          }
        />
        <Route
          path="/pharmacy"
          element={
            <RoleRoute roles={["admin", "pharmacy"]}>
              <PharmacyDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/pharmacy/operations"
          element={
            <RoleRoute roles={["admin", "pharmacy"]}>
              <PharmacyOperations />
            </RoleRoute>
          }
        />
        <Route
          path="/pharmacy/clinical"
          element={
            <RoleRoute roles={["admin", "pharmacy"]}>
              <PharmacyClinical />
            </RoleRoute>
          }
        />
        <Route
          path="/pharmacy/finance"
          element={
            <RoleRoute roles={["admin", "pharmacy"]}>
              <PharmacyFinance />
            </RoleRoute>
          }
        />
        <Route
          path="/pharmacy/inventory"
          element={
            <RoleRoute roles={["admin", "pharmacy"]}>
              <PharmacyInventory />
            </RoleRoute>
          }
        />
        <Route
          path="/pharmacy/dispense"
          element={
            <RoleRoute roles={["admin", "pharmacy", "doctor"]}>
              <PharmacyDispense />
            </RoleRoute>
          }
        />
        <Route
          path="/pharmacy/users"
          element={
            <RoleRoute roles={["admin"]}>
              <PharmacyUsers />
            </RoleRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <Complaints />
            </RoleRoute>
          }
        />
        <Route
          path="/sms"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <SmsReminders />
            </RoleRoute>
          }
        />
        <Route
          path="/theatres"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <TheatreUtilisation />
            </RoleRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <RoleRoute roles={["admin", "finance"]}>
              <FinanceDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/finance/billing"
          element={
            <RoleRoute roles={["admin", "finance"]}>
              <FinanceBilling />
            </RoleRoute>
          }
        />
        <Route
          path="/finance/procurement"
          element={
            <RoleRoute roles={["admin", "finance"]}>
              <FinanceProcurement />
            </RoleRoute>
          }
        />
        <Route
          path="/finance/budget"
          element={
            <RoleRoute roles={["admin", "finance"]}>
              <FinanceBudget />
            </RoleRoute>
          }
        />
        <Route
          path="/finance/accounting"
          element={
            <RoleRoute roles={["admin", "finance"]}>
              <FinanceAccounting />
            </RoleRoute>
          }
        />
        <Route
          path="/finance/irregular"
          element={
            <RoleRoute roles={["admin", "finance"]}>
              <FinanceIrregular />
            </RoleRoute>
          }
        />
        <Route
          path="/finance/cost-centres"
          element={
            <RoleRoute roles={["admin", "finance"]}>
              <Finance />
            </RoleRoute>
          }
        />
        <Route
          path="/finance/users"
          element={
            <RoleRoute roles={["admin"]}>
              <FinanceUsers />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <RoleRoute roles={["admin", "payroll"]}>
              <PayrollDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll/costs"
          element={
            <RoleRoute roles={["admin", "payroll"]}>
              <PayrollCosts />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll/timesheets"
          element={
            <RoleRoute roles={["admin", "payroll"]}>
              <PayrollTimesheets />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll/ghost-cases"
          element={
            <RoleRoute roles={["admin", "payroll"]}>
              <PayrollGhostCases />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll/compliance"
          element={
            <RoleRoute roles={["admin", "payroll"]}>
              <PayrollCompliance />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll/audit"
          element={
            <RoleRoute roles={["admin", "payroll"]}>
              <PayrollAudit />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll/reports"
          element={
            <RoleRoute roles={["admin", "payroll"]}>
              <PayrollReports />
            </RoleRoute>
          }
        />
        <Route
          path="/payroll/users"
          element={
            <RoleRoute roles={["admin"]}>
              <PayrollUsers />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/tenders"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementTenders />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/bids"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementBids />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/suppliers"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementSuppliers />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/contracts"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementContracts />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/spend"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementSpend />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/ledger"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementLedger />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/alerts"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementAlerts />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/insights"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementInsights />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/reports"
          element={
            <RoleRoute roles={["admin", "procurement"]}>
              <ProcurementReports />
            </RoleRoute>
          }
        />
        <Route
          path="/procurement/users"
          element={
            <RoleRoute roles={["admin"]}>
              <ProcurementUsers />
            </RoleRoute>
          }
        />
        <Route
          path="/reporting"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <ReportingExports />
            </RoleRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <RoleRoute roles={["admin"]}>
              <AuditTrail />
            </RoleRoute>
          }
        />
        <Route
          path="/hr"
          element={
            <RoleRoute roles={["admin", "hr"]}>
              <HrDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/recruitment"
          element={
            <RoleRoute roles={["admin", "hr"]}>
              <HrRecruitment />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/employees"
          element={
            <RoleRoute roles={["admin", "hr"]}>
              <HrEmployees />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/leave"
          element={
            <RoleRoute roles={["admin", "hr"]}>
              <HrLeave />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/training"
          element={
            <RoleRoute roles={["admin", "hr"]}>
              <HrTraining />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/reports"
          element={
            <RoleRoute roles={["admin", "hr"]}>
              <HrReports />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/users"
          element={
            <RoleRoute roles={["admin"]}>
              <HrUsers />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/pmds"
          element={
            <RoleRoute roles={["admin", "hr", "doctor"]}>
              <PmdsSupervision />
            </RoleRoute>
          }
        />
        <Route
          path="/monitoring"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <MonitoringKpis />
            </RoleRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <RoleRoute roles={["admin", "super_admin"]}>
              <Admin />
            </RoleRoute>
          }
        />
        <Route
          path="/cms"
          element={
            <RoleRoute roles={["super_admin"]}>
              <SuperAdminCms />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/queue"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorQueue />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/consult"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorConsult />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/orders"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorOrders />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/referrals"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorReferrals />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/notes"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorNotes />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/schedule"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorSchedule />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/governance"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorGovernance />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <RoleRoute roles={["doctor"]}>
              <DoctorProfile />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/doctors"
          element={
            <RoleRoute roles={["admin", "hr"]}>
              <HrDoctors />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/vacancies"
          element={
            <RoleRoute roles={["admin", "hr", "doctor"]}>
              <HrVacancies />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/staffing"
          element={
            <RoleRoute roles={["admin", "hr", "doctor"]}>
              <HrStaffing />
            </RoleRoute>
          }
        />
        <Route
          path="/clinical/waitlist"
          element={
            <RoleRoute roles={["admin", "doctor"]}>
              <SurgicalWaitlist />
            </RoleRoute>
          }
        />

        <Route
          path="/patient/dashboard"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/onboarding"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientOnboarding />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientAppointments />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/medications"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientMedications />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/records"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientRecords />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/notifications"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientNotifications />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/feedback"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientFeedback />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientProfile />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/support"
          element={
            <RoleRoute roles={["patient"]}>
              <PatientSupport />
            </RoleRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
