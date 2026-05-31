import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppLogo } from './AppLogo';

const KEY = 'arena_onboarding_done';

const STEPS = [
  {
    title: '1. Escolha um mercado',
    body: 'Navegue pela Copa 2026 (dados reais da Polymarket) ou pelos mercados simulados da UCDB.',
  },
  {
    title: '2. Aposte com saldo simulado',
    body: 'Você começa com US$ 1.000. Veja o retorno potencial antes de confirmar a aposta.',
  },
  {
    title: '3. Acompanhe no perfil',
    body: 'Histórico, favoritos, ranking e alertas de variação de cotação ficam no seu perfil.',
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);

  const finish = () => {
    localStorage.setItem(KEY, '1');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish()}>
      <DialogContent className="!max-w-lg !w-[92vw] rounded-md">
        <div className="flex justify-center pt-2">
          <AppLogo size="lg" />
        </div>
        <DialogHeader>
          <DialogTitle>Bem-vindo à Arena Polymarket</DialogTitle>
          <DialogDescription>Tour rápido em 3 passos</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h3 className="font-semibold mb-2">{STEPS[step].title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{STEPS[step].body}</p>
          <div className="flex gap-1 mt-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={finish} className="rounded-md">Pular</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="rounded-md">Próximo</Button>
          ) : (
            <Button onClick={finish} className="rounded-md">Começar</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
