
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import Satarknity from '@/components/Satarknity';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-satarknity-softGray to-white">
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-satarknity-dark">
              <span className="text-satarknity-primary">Satar</span>knity
            </h1>
            <p className="text-sm text-muted-foreground">Community Safety Alerts</p>
          </div>
          
          {user && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut} 
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        {user ? <Satarknity /> : <AuthForm />}
      </main>

      <footer className="container mx-auto py-6 px-4 mt-8">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 Satarknity. All rights reserved.</p>
          <p className="mt-1">Stay safe, stay informed.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
