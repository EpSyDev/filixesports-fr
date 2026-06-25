
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast('Connexion réussie');
      navigate('/admin');
    } catch (error) {
      toast.error('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - KOTIYA FC</title>
        <meta name="description" content="Connexion administrateur pour le tableau de bord KOTIYA FC" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md bg-card border-primary/20 ring-gold">
          <CardHeader className="text-center">
            <img src="/logo.webp" alt="KOTIYA FC" className="h-20 w-auto object-contain mx-auto mb-3 drop-shadow-[0_0_28px_rgba(186,139,74,0.45)]" />
            <div className="font-display text-3xl text-primary mb-4 uppercase tracking-wide">
              KOTIYA FC
            </div>
            <CardTitle>Connexion Administrateur</CardTitle>
            <CardDescription>Accédez au tableau de bord</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@kotiya.fr"
                  className="bg-background text-foreground"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="bg-background text-foreground"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;
