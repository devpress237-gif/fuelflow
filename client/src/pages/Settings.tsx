import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useStation } from "@/contexts/StationContext";
import { CURRENCY_CONFIG, type CurrencyCode } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();


  const { currency, setCurrency } = useCurrency();
  const { stationSettings, updateStationSettings, isLoading } = useStation();
  const { toast } = useToast();

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    lowStock: true,
    salesAlerts: true,
    paymentReminders: true,
    systemUpdates: false,
  });

  // Display preferences
  const [displayPreferences, setDisplayPreferences] = useState({
    compactView: false,
    showTips: true,
    autoRefresh: true,
    refreshInterval: "30",
  });

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    toast({
      title: "Theme updated",
      description: `Switched to ${newDarkMode ? 'dark' : 'light'} mode`,
    });
  };

  // Initialize theme state from current DOM state (theme is now initialized globally)
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  // Load saved settings on component mount
  useEffect(() => {
    // Load notification preferences
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('Failed to parse saved notifications:', error);
      }
    }

    // Load display preferences  
    const savedDisplayPreferences = localStorage.getItem('displayPreferences');
    if (savedDisplayPreferences) {
      try {
        const parsedDisplayPreferences = JSON.parse(savedDisplayPreferences);
        setDisplayPreferences(parsedDisplayPreferences);
      } catch (error) {
        console.error('Failed to parse saved display preferences:', error);
      }
    }
  }, []);

  // Handle currency change
  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    toast({
      title: "Currency updated",
      description: `Currency changed to ${CURRENCY_CONFIG[newCurrency].name}`,
    });
  };

  // Save settings
  const saveSettings = () => {
    // Save to localStorage and global context
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('displayPreferences', JSON.stringify(displayPreferences));

    toast({
      title: "Settings saved",
      description: "Your preferences have been saved successfully",
    });
  };

  // Show loading state while station settings are loading
  if (isLoading || !stationSettings) {
    return (
      <div className="space-y-6 fade-in">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-card-foreground mb-2">Settings</h3>
          <p className="text-muted-foreground">
            Loading your preferences and configuration...
          </p>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
          </div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-card-foreground mb-2">Settings</h3>
        <p className="text-muted-foreground">
          Manage your preferences, currency settings, and system configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency & Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              💱 Currency & Localization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency-select" className="text-sm font-medium">
                Default Currency
              </Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="mt-2" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CURRENCY_CONFIG) as [CurrencyCode, typeof CURRENCY_CONFIG[CurrencyCode]][]).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{config.symbol}</span>
                        <span>{config.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Current: {CURRENCY_CONFIG[currency].symbol} {CURRENCY_CONFIG[currency].name}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              🎨 Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle between light and dark themes
                </p>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                data-testid="switch-dark-mode"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Compact View</Label>
                <p className="text-xs text-muted-foreground">
                  Use smaller cards and spacing
                </p>
              </div>
              <Switch
                checked={displayPreferences.compactView}
                onCheckedChange={(checked) => 
                  setDisplayPreferences(prev => ({ ...prev, compactView: checked }))
                }
                data-testid="switch-compact-view"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Show Tips</Label>
                <p className="text-xs text-muted-foreground">
                  Display helpful tips throughout the app
                </p>
              </div>
              <Switch
                checked={displayPreferences.showTips}
                onCheckedChange={(checked) => 
                  setDisplayPreferences(prev => ({ ...prev, showTips: checked }))
                }
                data-testid="switch-show-tips"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              🔔 Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Low Stock Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when tank levels are low
                </p>
              </div>
              <Switch
                checked={notifications.lowStock}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, lowStock: checked }))
                }
                data-testid="switch-low-stock"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Sales Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Notify for large transactions
                </p>
              </div>
              <Switch
                checked={notifications.salesAlerts}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, salesAlerts: checked }))
                }
                data-testid="switch-sales-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Payment Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Remind about overdue payments
                </p>
              </div>
              <Switch
                checked={notifications.paymentReminders}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, paymentReminders: checked }))
                }
                data-testid="switch-payment-reminders"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">System Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Notify about app updates
                </p>
              </div>
              <Switch
                checked={notifications.systemUpdates}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, systemUpdates: checked }))
                }
                data-testid="switch-system-updates"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              ⚡ Data & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically refresh data
                </p>
              </div>
              <Switch
                checked={displayPreferences.autoRefresh}
                onCheckedChange={(checked) => 
                  setDisplayPreferences(prev => ({ ...prev, autoRefresh: checked }))
                }
                data-testid="switch-auto-refresh"
              />
            </div>

            {displayPreferences.autoRefresh && (
              <div>
                <Label className="text-sm font-medium">Refresh Interval (seconds)</Label>
                <Select 
                  value={displayPreferences.refreshInterval} 
                  onValueChange={(value) => 
                    setDisplayPreferences(prev => ({ ...prev, refreshInterval: value }))
                  }
                >
                  <SelectTrigger className="mt-2" data-testid="select-refresh-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-3">Color Theme</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'light');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 mb-2"></div>
                  <span className="text-sm">Light</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'dark');
                    document.documentElement.classList.remove('theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('dark');
                    setIsDarkMode(true);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-black border-2 mb-2"></div>
                  <span className="text-sm">Dark</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'ocean');
                    document.documentElement.classList.remove('dark', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-ocean');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border-2 mb-2"></div>
                  <span className="text-sm">Ocean</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'forest');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-forest');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-2 mb-2"></div>
                  <span className="text-sm">Forest</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'sunset');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-sunset');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-purple-500 border-2 mb-2"></div>
                  <span className="text-sm">Sunset</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'rose');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-rose');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-500 border-2 mb-2"></div>
                  <span className="text-sm">Rose</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'lavender');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-lavender');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-300 to-indigo-400 border-2 mb-2"></div>
                  <span className="text-sm">Lavender</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'mint');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-mint');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-300 to-teal-400 border-2 mb-2"></div>
                  <span className="text-sm">Mint</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'slate');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-slate');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-blue-500 border-2 mb-2"></div>
                  <span className="text-sm">Slate</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'amber');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-crimson', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-amber');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 mb-2"></div>
                  <span className="text-sm">Amber</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'crimson');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-indigo', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-crimson');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-pink-600 border-2 mb-2"></div>
                  <span className="text-sm">Crimson</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'indigo');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-teal', 'theme-chocolate');
                    document.documentElement.classList.add('theme-indigo');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 border-2 mb-2"></div>
                  <span className="text-sm">Indigo</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'teal');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-chocolate');
                    document.documentElement.classList.add('theme-teal');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 border-2 mb-2"></div>
                  <span className="text-sm">Teal</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'chocolate');
                    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-rose', 'theme-lavender', 'theme-mint', 'theme-slate', 'theme-amber', 'theme-crimson', 'theme-indigo', 'theme-teal');
                    document.documentElement.classList.add('theme-chocolate');
                    setIsDarkMode(false);
                  }}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brown-600 to-amber-700 border-2 mb-2"></div>
                  <span className="text-sm">Chocolate</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            🏪 Station Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="station-name" className="text-sm font-medium">Station Name</Label>
              <Input
                id="station-name"
                value={stationSettings?.stationName || ''}
                onChange={(e) => updateStationSettings?.({ stationName: e.target.value })}
                data-testid="input-station-name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="contact-number" className="text-sm font-medium">Contact Number</Label>
              <Input
                id="contact-number"
                value={stationSettings?.contactNumber || ''}
                onChange={(e) => updateStationSettings?.({ contactNumber: e.target.value })}
                data-testid="input-contact-number"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={stationSettings?.email || ''}
                onChange={(e) => updateStationSettings?.({ email: e.target.value })}
                data-testid="input-email"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="gst-number" className="text-sm font-medium">GST Number</Label>
              <Input
                id="gst-number"
                value={stationSettings?.gstNumber || ''}
                onChange={(e) => updateStationSettings?.({ gstNumber: e.target.value })}
                data-testid="input-gst-number"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Input
                id="address"
                value={stationSettings?.address || ''}
                onChange={(e) => updateStationSettings?.({ address: e.target.value })}
                data-testid="input-address"
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} size="lg" data-testid="button-save-settings">
          Save All Settings
        </Button>
      </div>
    </div>
  );
}