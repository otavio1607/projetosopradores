import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LicenseService } from '@/services/licenseService';
import { License, LicenseStatus } from '@/types/licensing';
import { AlertCircle, CheckCircle, XCircle, Clock, Copy, Download } from 'lucide-react';

export interface LicenseManagerProps {
  onLicenseValidated?: (license: License) => void;
  onError?: (error: string) => void;
}

export function LicenseManager({ onLicenseValidated, onError }: LicenseManagerProps) {
  const [license, setLicense] = useState<License | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Carrega licença ao montar
    const localLicense = LicenseService.getLocalLicense();
    if (localLicense) {
      setLicense(localLicense);
      validateLicense(localLicense.key);
    }
  }, []);

  const validateLicense = async (key: string) => {
    setIsLoading(true);
    try {
      const result = await LicenseService.validateLicense(key);

      if (result.valid && result.license) {
        setLicense(result.license);
        onLicenseValidated?.(result.license);
      } else {
        onError?.(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao validar';
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) return;

    setIsLoading(true);
    try {
      const activated = await LicenseService.activateLicense(licenseKey);
      setLicense(activated);
      setLicenseKey('');
      setShowDialog(false);
      onLicenseValidated?.(activated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao ativar';
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (license?.key) {
      navigator.clipboard.writeText(license.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadLicense = () => {
    if (!license) return;

    const licenseData = JSON.stringify(license, null, 2);
    const blob = new Blob([licenseData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-${license.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: LicenseStatus) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'trial':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: LicenseStatus) => {
    const labels = {
      valid: { label: 'Ativa', color: 'bg-green-100 text-green-800' },
      expired: { label: 'Expirada', color: 'bg-red-100 text-red-800' },
      trial: { label: 'Teste', color: 'bg-blue-100 text-blue-800' },
      invalid: { label: 'Inválida', color: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Suspensa', color: 'bg-yellow-100 text-yellow-800' },
    };
    return labels[status];
  };

  if (!license) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle>Ativar Licença</CardTitle>
          <CardDescription>
            Insira sua chave de licença para ativar todos os recursos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">Ativar Licença</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ativar Licença</DialogTitle>
                <DialogDescription>
                  Cole sua chave de licença para ativar a plataforma
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Chave da Licença</label>
                  <Input
                    placeholder="SOPR-PRO-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleActivateLicense}
                  disabled={isLoading || !licenseKey.trim()}
                  className="w-full"
                >
                  {isLoading ? 'Validando...' : 'Validar e Ativar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-sm text-gray-600 space-y-2">
            <p>📌 Não tem licença?</p>
            <Button variant="outline" className="w-full">
              Compre uma Licença
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getStatusLabel(license.status);
  const daysLeft = Math.ceil(
    (new Date(license.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={license.status === 'valid' ? 'border-green-200 bg-green-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(license.status)}
              Licença do Sistema
            </CardTitle>
            <CardDescription>{license.organizationName}</CardDescription>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informações da Licença */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-600 mb-1">Plano</p>
            <p className="font-semibold text-lg capitalize">{license.planType}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-600 mb-1">Equipamentos</p>
            <p className="font-semibold text-lg">
              {license.maxEquipment === 999 ? '∞' : license.maxEquipment}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-600 mb-1">Usuários</p>
            <p className="font-semibold text-lg">
              {license.maxUsers === 99 ? '∞' : license.maxUsers}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-600 mb-1">Dias Restantes</p>
            <p className={`font-semibold text-lg ${daysLeft <= 30 ? 'text-red-600' : ''}`}>
              {daysLeft > 0 ? daysLeft : 'Expirado'}
            </p>
          </div>
        </div>

        {/* Aviso de Expiração */}
        {daysLeft <= 30 && daysLeft > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Sua licença vence em {daysLeft} dias. Renove agora para evitar interrupções.
            </AlertDescription>
          </Alert>
        )}

        {daysLeft <= 0 && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Sua licença expirou. Alguns recursos estão indisponíveis.
              <Button variant="link" className="ml-2 h-auto p-0 text-red-600">
                Renovar Agora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Chave da Licença */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Chave da Licença</label>
          <div className="flex gap-2">
            <Input
              value={license.key}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              title="Copiar"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          {copied && <p className="text-sm text-green-600">Copiado!</p>}
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Emitida em</p>
            <p className="font-medium">{new Date(license.issuedAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Expira em</p>
            <p className="font-medium">{new Date(license.expiresAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Recursos Disponíveis</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(license.features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                {enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-300" />
                )}
                <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>
                  {feature.replace(/_/g, ' ').charAt(0).toUpperCase() + feature.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={downloadLicense}>
            <Download className="w-4 h-4 mr-2" />
            Baixar Licença
          </Button>
          <Button variant="outline" className="flex-1">
            Renovar Plano
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
