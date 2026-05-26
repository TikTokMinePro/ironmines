UPDATE public.email_templates SET body_html = 
'<h2 style="color: #E01393; margin-bottom: 16px; font-size: 20px;">⚠️ Sua assinatura expira em breve</h2>
<p style="margin-bottom: 12px;">Olá <strong style="color: #ffffff;">{{name}}</strong>,</p>
<p style="margin-bottom: 12px;">Sua assinatura IronMines expira em <strong style="color: #E01393;">{{days_left}} dias</strong>.</p>
<p style="margin-bottom: 20px;">Renove agora para continuar acessando todos os dados de mineração e ferramentas de IA.</p>
<div style="text-align: center; margin: 28px 0;">
  <a href="{{renewal_url}}" style="background: linear-gradient(135deg, #E01393, #c01080); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 14px; box-shadow: 0 4px 16px rgba(224,19,147,0.3);">Renovar Assinatura</a>
</div>'
WHERE slug = 'expiring_warning';

UPDATE public.email_templates SET body_html = 
'<h2 style="color: #E01393; margin-bottom: 16px; font-size: 20px;">🎁 Oferta Especial de Renovação</h2>
<p style="margin-bottom: 12px;">Olá <strong style="color: #ffffff;">{{name}}</strong>,</p>
<p style="margin-bottom: 12px;">Sua assinatura expira em <strong style="color: #E01393;">{{days_left}} dias</strong>. Temos uma oferta exclusiva para você!</p>
<div style="background: rgba(224,19,147,0.08); border: 1px solid rgba(224,19,147,0.2); border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
  <p style="font-size: 28px; font-weight: 800; color: #E01393; margin: 0 0 4px;">10% OFF</p>
  <p style="font-size: 13px; color: #aaa; margin: 0;">Desconto exclusivo por tempo limitado</p>
</div>
<div style="text-align: center; margin: 28px 0;">
  <a href="{{renewal_url}}" style="background: linear-gradient(135deg, #E01393, #c01080); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 14px; box-shadow: 0 4px 16px rgba(224,19,147,0.3);">Renovar com Desconto</a>
</div>'
WHERE slug = 'renewal_discount';

UPDATE public.email_templates SET body_html = 
'<h2 style="color: #E01393; margin-bottom: 16px; font-size: 20px;">Cancelamento Confirmado</h2>
<p style="margin-bottom: 12px;">Olá <strong style="color: #ffffff;">{{name}}</strong>,</p>
<p style="margin-bottom: 12px;">Seu cancelamento foi processado com sucesso. Você ainda tem acesso até <strong style="color: #E01393;">{{expires_at}}</strong>.</p>
<p style="margin-bottom: 20px;">Sentiremos sua falta! Se mudar de ideia, você pode reativar sua assinatura a qualquer momento.</p>
<div style="text-align: center; margin: 28px 0;">
  <a href="{{renewal_url}}" style="background: linear-gradient(135deg, #E01393, #c01080); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 14px; box-shadow: 0 4px 16px rgba(224,19,147,0.3);">Reativar Assinatura</a>
</div>'
WHERE slug = 'subscription_cancelled';

UPDATE public.email_templates SET body_html = 
'<h2 style="color: #E01393; margin-bottom: 16px; font-size: 20px;">Sua Assinatura Expirou</h2>
<p style="margin-bottom: 12px;">Olá <strong style="color: #ffffff;">{{name}}</strong>,</p>
<p style="margin-bottom: 12px;">Sua assinatura IronMines expirou. Renove agora para voltar a acessar:</p>
<ul style="color: #ccc; margin: 16px 0; padding-left: 20px; line-height: 2;">
  <li>🔥 Ranking de Produtos Virais</li>
  <li>🎬 Vídeos que mais faturam</li>
  <li>🤖 Influencer IA para criativos</li>
</ul>
<div style="text-align: center; margin: 28px 0;">
  <a href="{{renewal_url}}" style="background: linear-gradient(135deg, #E01393, #c01080); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 14px; box-shadow: 0 4px 16px rgba(224,19,147,0.3);">Renovar Agora</a>
</div>'
WHERE slug = 'subscription_expired';

UPDATE public.email_templates SET body_html = 
'<h2 style="color: #E01393; margin-bottom: 16px; font-size: 20px;">🚀 Bem-vindo ao IronMines!</h2>
<p style="margin-bottom: 12px;">Olá <strong style="color: #ffffff;">{{name}}</strong>,</p>
<p style="margin-bottom: 16px;">Sua conta foi criada com sucesso. Aqui estão seus dados de acesso:</p>
<div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 20px; margin: 20px 0;">
  <p style="margin: 0 0 8px; font-size: 13px; color: #888;">Email</p>
  <p style="margin: 0 0 16px; font-size: 15px; color: #fff; font-weight: 600;">{{email}}</p>
  <p style="margin: 0 0 8px; font-size: 13px; color: #888;">Senha</p>
  <p style="margin: 0; font-size: 15px; color: #fff; font-weight: 600; font-family: monospace;">{{password}}</p>
</div>
<p style="font-size: 13px; color: #888; margin-bottom: 20px;">Recomendamos alterar sua senha após o primeiro acesso.</p>
<div style="text-align: center; margin: 28px 0;">
  <a href="{{login_url}}" style="background: linear-gradient(135deg, #E01393, #c01080); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 14px; box-shadow: 0 4px 16px rgba(224,19,147,0.3);">Acessar Plataforma</a>
</div>'
WHERE slug = 'welcome_credentials';

UPDATE public.email_templates SET body_html = 
'<h2 style="color: #E01393; margin-bottom: 16px; font-size: 20px;">🔒 Redefinição de Senha</h2>
<p style="margin-bottom: 12px;">Olá <strong style="color: #ffffff;">{{name}}</strong>,</p>
<p style="margin-bottom: 12px;">Uma redefinição de senha foi solicitada para sua conta IronMines.</p>
<p style="margin-bottom: 20px;">Clique no botão abaixo para definir uma nova senha:</p>
<div style="text-align: center; margin: 28px 0;">
  <a href="{{reset_url}}" style="background: linear-gradient(135deg, #E01393, #c01080); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 14px; box-shadow: 0 4px 16px rgba(224,19,147,0.3);">Redefinir Senha</a>
</div>
<p style="font-size: 13px; color: #666;">Se você não solicitou essa redefinição, ignore este email.</p>'
WHERE slug = 'password_reset';