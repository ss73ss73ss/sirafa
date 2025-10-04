import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";

import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SecurityGate from "@/components/SecurityGate";
import InstallPrompt from "@/components/mobile/InstallPrompt";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AuthInlinePage from "@/pages/auth-inline-page";
import DashboardPage from "@/pages/dashboard-page";

import TransfersPage from "@/pages/transfers-page";
import UpgradeRequestPage from "@/pages/upgrade-request-page";
import AdminPage from "@/pages/admin-page";
import AdminUpgradeRequestsPage from "@/pages/admin-upgrade-requests-page";
import MarketPage from "@/pages/market-page";
import BalancePage from "@/pages/balance-page";
import VerifyAccountPage from "@/pages/verify-account-page";
import CityTransfersPage from "@/pages/city-transfers-page";
import OfficeCommissionPage from "@/pages/office-commission-page";
import SimpleCommissionsPage from "@/pages/simple-commissions-page";
import ReceiveCityTransferPage from "@/pages/receive-city-transfer-page";
import AdminSimpleTransfersPage from "@/pages/admin-simple-transfers-page";
import AdminTransfersDashboardPage from "@/pages/admin-transfers-dashboard-page";
import VerificationPage from "@/pages/verification-page";
import VerificationFormPage from "@/pages/verification-form";
import AdminVerificationPage from "@/pages/admin-verification-page";
import UserDashboardPage from "@/pages/user-dashboard-page";
import InternalTransferPage from "@/pages/internal-transfer-page";

import AdminUsersPage from "@/pages/admin-users-page";
import AdminNotificationsPage from "@/pages/admin-notifications-page";
import NotificationsPage from "@/pages/notifications-page";
import ChatPage from "@/pages/chat-page";
import PrivateChatPage from "@/pages/private-chat-page";
import GroupChatsPage from "@/pages/group-chats-page";
import GroupChatPage from "@/pages/group-chat-page";
import AgentCommissionSettingsPage from "@/pages/agent-commission-settings-page";
import CommissionSettingsPage from "@/pages/commission-settings-page";
import CommissionPoolPage from "@/pages/commission-pool-page";
import SystemCommissionRatesPage from "@/pages/system-commission-rates-page";
import AdminCountriesPage from "@/pages/admin-countries-page";
import InterOfficeTransferPage from "@/pages/inter-office-transfer-page";
import InterOfficeTransferCompletePage from "@/pages/inter-office-transfer-complete";
import InterOfficeReceivePage from "@/pages/inter-office-receive-page";
import InterOfficeCommissionsPage from "@/pages/inter-office-commissions-page";
import OfficeManagementPage from "@/pages/office-management-page";
import UserReceiveSettingsPage from "@/pages/user-receive-settings-page";
import SettingsPage from "@/pages/settings-page";
import SupportPage from "@/pages/support-page";
import ReceiveInternationalTransferPage from "@/pages/receive-international-transfer-page";
import MultiCurrencyCommissionSettingsPage from "@/pages/admin/multi-currency-commission-settings-page";
import EnhancedCommissionSettingsPage from "@/pages/admin/enhanced-commission-settings-page";
import SimpleCommissionSettings from "@/pages/simple-commission-settings";
import CommissionLogsPage from "@/pages/admin/commission-logs-page";
import SecurityAdminPage from "@/pages/security-admin-page";
import SecurityTestPage from "@/pages/security-test-page";
import SecurityDemoPage from "@/pages/security-demo-page";
import AdminInternalTransferLogsPage from "@/pages/admin-internal-transfer-logs-page";
import AdminTransactionsPage from "@/pages/admin-transactions-page";
import StatementPage from "@/pages/statement-page";
import ReceiptsManagementPage from "@/pages/receipts-management";

import InternationalTransferReceivePage from "@/pages/international-transfer-receive-page";
import VoiceTestPage from "@/pages/voice-test-page";
import AdminMessageMonitoringPage from "@/pages/admin-message-monitoring-full";
import ExternalTransferRequestPage from "@/pages/external-transfer-request-page";
import ReferralsPage from "@/pages/referrals-page";
import ReferralSettingsPage from "@/pages/admin/referral-settings-page";
import AdminFixedRewardsPage from "@/pages/admin-fixed-rewards-page";
import AccessRestrictionsPage from "@/pages/admin/access-restrictions-page";
import DevStudioPage from "@/pages/admin/dev-studio-page";
import PagesEditor from "@/pages/admin/dev-studio/pages-editor";
import ThemeEditor from "@/pages/admin/dev-studio/theme-editor";
import FeatureFlagsEditor from "@/pages/admin/dev-studio/feature-flags-editor";
import InternationalPage from "@/pages/international-page";
import BlockedPage from "@/pages/blocked-page";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";
import { PushNotificationsProvider } from "@/hooks/use-push-notifications";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/components/theme-provider";
import { AppChrome } from "@/components/mobile/AppChrome";

// Redirect صغير مبني على wouter (يحترم الـ base)
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

function Routes() {
  return (
    <Switch>
      {/* عامة */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthInlinePage} />
      <Route path="/auth-old" component={AuthPage} />

      {/* محمية */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/balance" component={BalancePage} />
      <ProtectedRoute path="/transfers" component={TransfersPage} />
      <ProtectedRoute path="/internal-transfer" component={InternalTransferPage} />
      <ProtectedRoute path="/statement" component={StatementPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/private-chat/:userId" component={PrivateChatPage} />
      <ProtectedRoute path="/private-chat" component={PrivateChatPage} />
      <ProtectedRoute path="/group-chats" component={GroupChatsPage} />
      <ProtectedRoute path="/group-chats/:groupId" component={GroupChatPage} />

      {/* إعادة توجيه تتبع الـ base (بدون window.location) */}
      <ProtectedRoute
        path="/market/direct"
        component={() => <Redirect to="/market" />}
      />
      <ProtectedRoute path="/market" component={MarketPage} />

      <ProtectedRoute path="/upgrade-request" component={UpgradeRequestPage} />
      <ProtectedRoute path="/external-transfer-request" component={ExternalTransferRequestPage} />
      <ProtectedRoute path="/verify-account" component={VerifyAccountPage} />
      <ProtectedRoute path="/city-transfers" component={CityTransfersPage} />
      <ProtectedRoute path="/receive-city-transfer" component={ReceiveCityTransferPage} />
      <ProtectedRoute path="/office-commission" component={OfficeCommissionPage} />
      <ProtectedRoute path="/simple-commissions" component={SimpleCommissionsPage} />
      <ProtectedRoute path="/verification" component={VerificationPage} />
      <ProtectedRoute path="/verification-form" component={VerificationFormPage} />
      <ProtectedRoute path="/user-dashboard" component={UserDashboardPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin-transactions" component={AdminTransactionsPage} />
      <ProtectedRoute path="/admin/transactions" component={AdminTransactionsPage} />
      <ProtectedRoute path="/admin-upgrade-requests" component={AdminUpgradeRequestsPage} />
      <ProtectedRoute path="/admin/upgrade-requests" component={AdminUpgradeRequestsPage} />
      <ProtectedRoute path="/admin-simple-transfers" component={AdminSimpleTransfersPage} />
      <ProtectedRoute path="/admin-transfers-dashboard" component={AdminTransfersDashboardPage} />
      <ProtectedRoute path="/admin-verification" component={AdminVerificationPage} />

      <ProtectedRoute path="/admin-users" component={AdminUsersPage} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <ProtectedRoute path="/admin-notifications" component={AdminNotificationsPage} />

      {/* مكتب موحّد + تحويل مسارات قديمة */}
      <ProtectedRoute path="/office-management" component={OfficeManagementPage} />
      <ProtectedRoute
        path="/inter-office-transfer"
        component={() => <Redirect to="/office-management" />}
      />
      <ProtectedRoute
        path="/inter-office-commissions"
        component={() => <Redirect to="/office-management" />}
      />

      <ProtectedRoute path="/agent/commission-settings" component={CommissionSettingsPage} />
      <ProtectedRoute path="/agent-commission-settings" component={AgentCommissionSettingsPage} />
      <ProtectedRoute path="/commission-settings" component={CommissionSettingsPage} />
      <ProtectedRoute path="/commission-pool" component={CommissionPoolPage} />
      <ProtectedRoute path="/admin/commission-pool" component={CommissionPoolPage} />
      <ProtectedRoute path="/system-commission-rates" component={SystemCommissionRatesPage} />
      <ProtectedRoute path="/admin/system-commission-rates" component={SystemCommissionRatesPage} />
      <ProtectedRoute path="/admin-countries" component={AdminCountriesPage} />
      <ProtectedRoute path="/admin/multi-currency-commission-settings" component={MultiCurrencyCommissionSettingsPage} />
      <ProtectedRoute path="/admin/enhanced-commission-settings" component={EnhancedCommissionSettingsPage} />
      <ProtectedRoute path="/simple-commission-settings" component={SimpleCommissionSettings} />
      <ProtectedRoute path="/admin/commission-logs" component={CommissionLogsPage} />
      <ProtectedRoute path="/admin/internal-transfer-logs" component={AdminInternalTransferLogsPage} />
      <ProtectedRoute path="/receipts-management" component={ReceiptsManagementPage} />
      <ProtectedRoute path="/security-admin" component={SecurityAdminPage} />

      {/* عامة للأمان/الديمو */}
      <Route path="/security-test" component={SecurityTestPage} />
      <Route path="/security-demo" component={SecurityDemoPage} />

      <ProtectedRoute path="/inter-office-receive" component={InterOfficeReceivePage} />
      <ProtectedRoute path="/transfers/inter-office" component={InterOfficeReceivePage} />

      <ProtectedRoute path="/user-receive-settings" component={UserReceiveSettingsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/dashboard/settings" component={SettingsPage} />
      <ProtectedRoute path="/user-settings" component={SettingsPage} />
      <ProtectedRoute path="/account-settings" component={SettingsPage} />
      <ProtectedRoute path="/support" component={SupportPage} />
      <ProtectedRoute path="/receive-international-transfer" component={ReceiveInternationalTransferPage} />
      <ProtectedRoute path="/referrals" component={ReferralsPage} />
      <ProtectedRoute path="/admin/referral-settings" component={ReferralSettingsPage} />
      <ProtectedRoute path="/admin/fixed-rewards" component={AdminFixedRewardsPage} />
      <ProtectedRoute path="/admin/restrictions" component={AccessRestrictionsPage} />
      <ProtectedRoute path="/admin/access-restrictions" component={AccessRestrictionsPage} />
      <ProtectedRoute path="/admin/dev-studio" component={DevStudioPage} />
      <ProtectedRoute path="/admin/dev-studio/pages" component={PagesEditor} />
      <ProtectedRoute path="/admin/dev-studio/themes" component={ThemeEditor} />
      <ProtectedRoute path="/admin/dev-studio/features" component={FeatureFlagsEditor} />
      <ProtectedRoute path="/international" component={InternationalPage} />
      <Route path="/blocked" component={BlockedPage} />

      <ProtectedRoute path="/international-transfer-receive" component={InternationalTransferReceivePage} />
      <ProtectedRoute path="/voice-test" component={VoiceTestPage} />
      <ProtectedRoute path="/admin/message-monitoring" component={AdminMessageMonitoringPage} />

      {/* Catch-all لأي مسار مش معرّف */}
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="exchange-theme">
      <QueryClientProvider client={queryClient}>
        <SecurityGate>
          <AuthProvider>
            <NotificationsProvider>
              <PushNotificationsProvider>
                <TooltipProvider>
                  <Toaster />
                  <InstallPrompt />
                  <AppChrome>
                    <Routes />
                  </AppChrome>
                </TooltipProvider>
              </PushNotificationsProvider>
            </NotificationsProvider>
          </AuthProvider>
        </SecurityGate>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
