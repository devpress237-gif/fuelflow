import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  User,
  Shield,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Globe,
  Clock,
  Calendar,
  Hash,
  CheckCircle2,
  XCircle,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { ChangeEvent } from "react";

export default function ProfilePage() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        fullName: z.string().min(1, "Full name is required"),
        email: z
          .string()
          .email("Invalid email address")
          .optional()
          .or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        preferredLanguage: z.string().optional(),
        timeZone: z.string().optional(),
        avatarUrl: z.string().optional().or(z.literal("")),
      }),
    ),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      preferredLanguage: user?.preferredLanguage || "English",
      timeZone: user?.timeZone || "UTC",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB limit for base64
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please choose an image smaller than 1MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("avatarUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: any) => {
    try {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, values);
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        const error = await res.json();
        throw new Error(error.message || "Update failed");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description:
          error.message || "There was an error updating your profile.",
      });
    }
  };

  if (!user) return null;

  return (
    <>
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-6 mb-8 bg-card p-6 rounded-lg border shadow-sm">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage
              src={form.watch("avatarUrl") || user.avatarUrl}
              alt={user.fullName}
            />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {user.fullName
                ? user.fullName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                : "U"}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer hover:bg-primary/90 shadow-sm"
          >
            <Upload className="h-4 w-4" />
            <input
              id="avatar-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{user.fullName}</h1>
            <Badge variant="secondary" className="capitalize">
              {user.role}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Account ID: <span className="font-mono text-xs">{user.id}</span>
          </p>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Joined{" "}
              {user.createdAt
                ? format(new Date(user.createdAt), "MMM dd, yyyy")
                : "N/A"}
            </div>
            {user.lastLogin && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last Login: {format(new Date(user.lastLogin), "MMM dd, HH:mm")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Username
                      </Label>
                      <Input
                        value={user.username}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground italic">
                        Username cannot be changed
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Full Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your full name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="email@example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Phone Number
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input {...field} placeholder="+1234567890" />
                            </FormControl>
                            <div className="absolute right-3 top-2.5">
                              {user.phoneVerified ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200 gap-1 px-1.5"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Verified
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 px-1.5"
                                >
                                  <XCircle className="h-3 w-3" /> Unverified
                                </Badge>
                              )}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <FormField
                      control={form.control}
                      name="preferredLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="h-4 w-4" /> Preferred Language
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="English, Urdu, etc."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Time Zone
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="UTC, GMT+5, etc." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Account technical details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-dashed">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" /> User ID
                </span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dashed">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Role
                </span>
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dashed">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Created
                </span>
                <span className="text-sm">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMM dd, yyyy")
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Last Login
                </span>
                <span className="text-sm">
                  {user.lastLogin
                    ? format(new Date(user.lastLogin), "MMM dd, HH:mm")
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
