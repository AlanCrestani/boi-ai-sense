import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, 
  Mail, 
  Copy, 
  Check, 
  X, 
  Calendar,
  Users,
  Clock,
  AlertCircle
} from "lucide-react";
import { useInvitations } from "@/hooks/useInvitations";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function InviteManager() {
  const { canManageOrganization, organization } = useAuth();
  const { createInvitation, getInvitations, cancelInvitation, loading } = useInvitations();
  
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'employee' as 'owner' | 'admin' | 'manager' | 'employee' | 'viewer'
  });
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (canManageOrganization) {
      loadInvitations();
    }
  }, [canManageOrganization]);

  const loadInvitations = async () => {
    const { data } = await getInvitations();
    setInvitations(data);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.role) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const result = await createInvitation(formData.email, formData.role);
    
    if (!result.error) {
      setFormData({ email: '', role: 'employee' });
      setShowDialog(false);
      loadInvitations();
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinks(prev => new Set([...prev, token]));
      toast.success('Link copiado para a área de transferência!');
      
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(token);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    const result = await cancelInvitation(invitationId);
    if (result.success) {
      loadInvitations();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleName = (role: string) => {
    const roles = {
      owner: 'Proprietário',
      admin: 'Administrador',
      manager: 'Gerente',
      employee: 'Funcionário',
      viewer: 'Visualizador'
    };
    return roles[role as keyof typeof roles] || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!canManageOrganization) {
    return null;
  }

  const pendingInvites = invitations.filter(inv => inv.status === 'pending');
  const completedInvites = invitations.filter(inv => inv.status !== 'pending');

  return (
    <Card className="border-border-subtle bg-background-secondary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <Users className="h-5 w-5" />
              Gerenciar Equipe
            </CardTitle>
            <p className="text-sm text-text-secondary mt-1">
              Convide novos membros para {organization?.name}
            </p>
          </div>
          
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="tech" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Membro</DialogTitle>
                <DialogDescription>
                  Envie um convite para adicionar um novo membro à sua organização.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="employee">Funcionário</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="owner">Proprietário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" variant="tech" className="flex-1" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Convite"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes ({pendingInvites.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Check className="h-4 w-4" />
              Histórico ({completedInvites.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingInvites.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary">Nenhum convite pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvites.map((invitation) => (
                  <Card key={invitation.id} className="border-border-subtle">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-4 w-4 text-text-tertiary" />
                            <span className="font-medium text-text-primary">{invitation.email}</span>
                            <Badge className={`text-xs ${getStatusColor(invitation.status)}`}>
                              {invitation.status === 'pending' ? 'Pendente' : invitation.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span>Função: {getRoleName(invitation.role)}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Enviado: {formatDate(invitation.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Expira: {formatDate(invitation.expires_at)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(invitation.invitation_token)}
                            className="gap-2"
                          >
                            {copiedLinks.has(invitation.invitation_token) ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copiar Link
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvite(invitation.id)}
                            className="text-destructive hover:text-destructive gap-2"
                            disabled={loading}
                          >
                            <X className="h-3 w-3" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4 mt-4">
            {completedInvites.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary">Nenhum histórico de convites</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedInvites.map((invitation) => (
                  <Card key={invitation.id} className="border-border-subtle">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-4 w-4 text-text-tertiary" />
                            <span className="font-medium text-text-primary">{invitation.email}</span>
                            <Badge className={`text-xs ${getStatusColor(invitation.status)}`}>
                              {invitation.status === 'accepted' ? 'Aceito' :
                               invitation.status === 'cancelled' ? 'Cancelado' :
                               invitation.status === 'expired' ? 'Expirado' : invitation.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span>Função: {getRoleName(invitation.role)}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Enviado: {formatDate(invitation.created_at)}
                            </span>
                            {invitation.accepted_at && (
                              <span className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Aceito: {formatDate(invitation.accepted_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}