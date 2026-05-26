
-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create email_templates table
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active templates" ON public.email_templates
  FOR SELECT USING (is_active = true);

-- Seed default templates
INSERT INTO public.email_templates (slug, name, subject, body_html, description) VALUES
('welcome_credentials', 'Boas-vindas com Credenciais', 'Bem-vindo ao IronMines! Aqui estão seus dados de acesso', 
'<h2>Bem-vindo ao IronMines! 🎉</h2><p>Olá {{name}},</p><p>Sua conta foi criada com sucesso!</p><p><strong>Email:</strong> {{email}}<br/><strong>Senha:</strong> {{password}}</p><p><a href="{{login_url}}">Acessar Plataforma</a></p><p>Altere sua senha no primeiro acesso.</p><p>Equipe IronMines</p>',
'Enviado automaticamente quando uma assinatura é ativada'),

('renewal_discount', 'Renovação com Desconto', 'Renove com 10% de desconto! Oferta por tempo limitado', 
'<h2>Sua assinatura está expirando! ⏰</h2><p>Olá {{name}},</p><p>Sua assinatura expira em {{days_left}} dia(s).</p><p>Renove com <strong>10% de desconto</strong>: <strong>RENOVA10</strong></p><p>Válida por 7 dias.</p><p><a href="{{renewal_url}}">Renovar Agora</a></p><p>Equipe IronMines</p>',
'Enviado 7 dias antes da expiração, com desconto de 10%'),

('expiring_warning', 'Aviso de Expiração', 'Sua assinatura expira em {{days_left}} dias', 
'<h2>Sua assinatura está expirando 🔔</h2><p>Olá {{name}},</p><p>Sua assinatura expira em <strong>{{days_left}} dia(s)</strong>.</p><p><a href="{{renewal_url}}">Renovar Agora</a></p><p>Equipe IronMines</p>',
'Enviado 3 dias antes da expiração'),

('subscription_expired', 'Assinatura Expirada', 'Sua assinatura expirou - Renove agora', 
'<h2>Sua assinatura expirou 🔴</h2><p>Olá {{name}},</p><p>Sua assinatura expirou. Renove para recuperar o acesso.</p><p><a href="{{renewal_url}}">Renovar Assinatura</a></p><p>Equipe IronMines</p>',
'Enviado quando a assinatura expira'),

('subscription_cancelled', 'Cancelamento Confirmado', 'Confirmação de cancelamento', 
'<h2>Cancelamento Confirmado</h2><p>Olá {{name}},</p><p>Sua assinatura foi cancelada. Acesso até {{expires_at}}.</p><p><a href="{{renewal_url}}">Reativar Assinatura</a></p><p>Equipe IronMines</p>',
'Enviado quando o usuário cancela');

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
