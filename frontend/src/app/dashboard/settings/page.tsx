"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/providers/AuthProvider";
import {
  Moon,
  Sun,
  Monitor,
  User,
  Mail,
  Shield,
  LogOut,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout, token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(API_ENDPOINTS.auth.deleteAccount, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to delete account");
      }
      toast.success("Account deleted successfully");
      logout();
    } catch (_error) {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {user?.email || "Not signed in"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground capitalize">
                  {user?.role || "user"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how Shortly looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Theme</Label>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className={
                  theme === "light" ? "bg-primary text-primary-foreground" : ""
                }
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className={
                  theme === "dark" ? "bg-primary text-primary-foreground" : ""
                }
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className={
                  theme === "system" ? "bg-primary text-primary-foreground" : ""
                }
                onClick={() => setTheme("system")}
              >
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label htmlFor="auto-theme" className="text-base font-medium">
                Use system theme
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically switch based on your device settings
              </p>
            </div>
            <Switch
              id="auto-theme"
              checked={theme === "system"}
              onCheckedChange={(checked: boolean) =>
                setTheme(checked ? "system" : "light")
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-card border border-destructive/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sign Out */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              className="text-muted-foreground hover:bg-primary hover:text-destructive dark:hover:bg-primary dark:hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-destructive">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:hover:bg-destructive dark:hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove all of your data including all
                    shortened URLs and analytics.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete my account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
