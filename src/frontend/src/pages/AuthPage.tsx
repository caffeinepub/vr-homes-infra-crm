import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RegisterForm from '../components/RegisterForm';
import LoginForm from '../components/LoginForm';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <img
          src="/assets/generated/vr-homes-logo-transparent.dim_200x200.png"
          alt="VR Homes Infra"
          className="w-32 h-32 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          VR Homes Infra CRM
        </h1>
        <p className="text-lg text-muted-foreground">Agent Registration & Login Portal</p>
      </div>

      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Register as a new agent or login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'register' | 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
            </TabsList>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
