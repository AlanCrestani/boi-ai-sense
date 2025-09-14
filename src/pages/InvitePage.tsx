import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Activity, Mail, Lock, User, Eye, EyeOff, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInvitations } from "@/hooks/useInvitations";
import { toast } from "sonner";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { signUp, signIn, loading: authLoading, user } = useAuth();
  const { getInvitationByToken } = useInvitations();
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    loadInvitation();
  }, [token]);

  useEffect(() => {
    if (user) {
      navigate("/user-profile");
    }
  }, [user]);

  const loadInvitation = async () => {
    if (!token) {
      toast.error("Token de convite inválido");
      navigate("/");
      return;
    }

    const { data, error } = await getInvitationByToken(token);
    
    if (error || !data) {
      toast.error("Convite não encontrado ou expirado");
      navigate("/");
      return;
    }

    setInvitation(data);
    setFormData(prev => ({ ...prev, email: data.email }));
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const { error } = await signUp(
      invitation.email,
      formData.password,
      formData.name
    );
    
    if (error) {
      toast.error(error.message || "Erro ao criar conta");
    } else {
      toast.success("Conta criada! Bem-vindo à " + invitation.organizations.name);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password) {
      toast.error("Por favor, digite sua senha");
      return;
    }

    const { error } = await signIn(invitation.email, formData.password);
    
    if (error) {
      toast.error(error.message || "Erro ao fazer login");
    } else {
      toast.success("Login realizado! Bem-vindo à " + invitation.organizations.name);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Convite não encontrado</h2>
            <p className="text-text-secondary mb-4">
              Este convite pode ter expirado ou já foi usado.
            </p>
            <Link to="/signup">
              <Button variant="tech">Criar uma nova conta</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="relative">
              <Activity className="h-8 w-8 text-accent-primary" />
              <div className="absolute inset-0 bg-accent-primary/20 blur-lg rounded-full" />
            </div>
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ConectaBoi
            </div>
          </div>
          <p className="text-text-secondary text-sm">
            Você foi convidado para se juntar à
          </p>
          <p className="text-text-primary font-semibold">
            {invitation.organizations.name}
          </p>
        </div>

        {/* Invitation Info */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-accent-primary" />
              <div>
                <p className="text-sm text-text-secondary">
                  Convidado por {invitation.profiles?.full_name}
                </p>
                <p className="text-sm text-text-secondary">
                  Função: <span className="text-accent-primary capitalize">{invitation.role}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up/In Form */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="flex p-1 bg-background-secondary rounded-lg">
                <Button
                  type="button"
                  variant={isSignUp ? "tech" : "ghost"}
                  size="sm"
                  onClick={() => setIsSignUp(true)}
                  className="flex-1"
                >
                  Criar Conta
                </Button>
                <Button
                  type="button"
                  variant={!isSignUp ? "tech" : "ghost"}
                  size="sm"
                  onClick={() => setIsSignUp(false)}
                  className="flex-1"
                >
                  Já tenho conta
                </Button>
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-text-primary">
              {isSignUp ? "Criar sua conta" : "Entrar na sua conta"}
            </CardTitle>
            <CardDescription className="text-center text-text-secondary">
              {isSignUp 
                ? "Complete seu cadastro para aceitar o convite" 
                : "Entre com sua conta existente"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-primary">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={invitation.email}
                    className="pl-10 h-11"
                    disabled
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-text-primary">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-4 w-4" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-text-primary">
                  {isSignUp ? "Crie sua senha" : "Senha"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignUp ? "Crie uma senha segura" : "Sua senha"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="tech" className="w-full h-11 mt-6" disabled={authLoading}>
                {authLoading 
                  ? (isSignUp ? "Criando conta..." : "Entrando...") 
                  : (isSignUp ? "Aceitar convite" : "Entrar")
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}