import { Telegraf } from 'telegraf';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ADMIN_ID = process.env.ADMIN_ID;
const PRIVACY_LINK = process.env.PRIVACY_LINK || 'https://privacy.com.br/profile/SEU_PERFIL';

// ==========================================
// 📸 BANCO DE FOTOS DE PRÉVIA (ROTAÇÃO)
// ==========================================
// DICA: Envie suas fotos no privado do bot (usando sua conta ADMIN_ID).
// Ele vai te responder com o "file_id" exato para você colar aqui abaixo!
// Você também pode usar links diretos de imagens (https://...).
const FOTOS_PREVIA = [
    'https://via.placeholder.com/600x800.png?text=Previas+18+Foto+1',
    'https://via.placeholder.com/600x800.png?text=Previas+18+Foto+2',
    'https://via.placeholder.com/600x800.png?text=Previas+18+Foto+3',
    'https://via.placeholder.com/600x800.png?text=Previas+18+Foto+4'
];

// ==========================================
// 🔥 MENSAGENS PICANTES DE BOAS-VINDAS (/start)
// ==========================================
const BOAS_VINDAS_PICANTES = [
    `😈 <b>Oi amor, que bom que você veio...</b>\n\nAqui no Telegram eu preciso me comportar, mas no meu <b>Privacy</b> eu mostro TUDO sem censura e sem cortes 🔞💦\n\n🔥 Vídeos íntimos completos\n🔥 Bastidores bem safados\n🔥 Chat privado comigo\n\n💸 <b>É SÓ R$ 30,00</b> para liberar o acesso completo agora mesmo! Vem me ver bem de pertinho 👇`,

    `🤫 <b>Psiu... tava te esperando!</b>\n\nEssa foto é só uma pequena amostra do que eu aprontei hoje... O vídeo completo ficou proibido demais pra postar aqui 🔥😈\n\nPor <b>APENAS R$ 30,00</b> você destrava meu <b>Privacy VIP</b> com dezenas de vídeos e fotos sem nenhuma censura 💋\n\n👇 <b>Clica abaixo antes que eu tire da promoção:</b>`,

    `🔞 <b>Você aguenta ver o resto?</b> 👀🔥\n\nSe você gostou dessa prévia, imagina o que tem guardado no meu <b>Privacy</b>... Posto conteúdo novo toda semana bem à vontade pra você 💦\n\n💎 Acesso total por <b>SÓ R$ 30,00</b> (liberação imediata no PIX ou Cartão).\n\nVem gozar de curiosidade lá dentro 👇😈`,

    `💋 <b>Bem-vindo(a) ao meu cantinho secreto...</b>\n\nCansei de tomar bloqueio tentando postar aqui, então liberei tudo sem filtro no meu <b>Privacy</b> 🔥\n\n🚨 <b>Valor promocional: SÓ R$ 30,00</b> para ter acesso a todos os meus vídeos explícitos e ensaios exclusivos!\n\nNão fica só na vontade, clica aqui 👇`
];

// ==========================================
// ⏰ MENSAGENS ROTATIVAS (DISPARO A CADA 3 HORAS)
// ==========================================
const MENSAGENS_DISPARO = [
    `🔥 <b>ACABEI DE POSTAR VÍDEO NOVO NO PRIVACY!</b> 🔞\n\nGravei uma coisinha bem safada hoje e subi lá sem censura nenhuma... 💦😈\n\n💸 <b>É SÓ R$ 30,00</b> pra você entrar agora e assistir tudo na hora!\n\n👇 <b>Vem ver antes que eu apague:</b>`,

    `😈 <b>Ainda não entrou no meu Privacy, amor?</b>\n\nVocê tá perdendo meus melhores vídeos íntimos e fotos sem roupa... Aqui eu não posso mostrar nada, mas lá dentro eu me solto toda 💋🔥\n\n🚨 Libere seu acesso agora por <b>APENAS R$ 30,00</b> 👇`,

    `💦 <b>Tô online agora no meu Privacy...</b> 👀\n\nDeixei um presente bem picante esperando por você lá dentro 🔞🔥\n\nPor <b>SÓ R$ 30,00</b> você tem acesso imediato a todo o meu acervo proibido + conteúdos novos toda semana!\n\n👇 <b>Clique e entre agora:</b>`,

    `🚨 <b>PROMOÇÃO RELÂMPAGO LIBERADA!</b> 🔞🔥\n\nBaixei o acesso do meu <b>Privacy</b> pra <b>SÓ R$ 30,00</b> hoje! Pagou no PIX, liberou na hora sem enrolação 😈💦\n\nVem ver tudo o que o Telegram censura 👇`,

    `🌶️ <b>Uma prévia pra deixar seu dia mais quente...</b>\n\nQuer ver o que aconteceu depois dessa foto? O vídeo completo tá disponível agora no meu <b>Privacy</b> 🔞\n\n💎 Acesso total por <b>apenas R$ 30,00</b>! Clica abaixo e vem 👇`
];

// ==========================================
// ⚙️ FUNÇÕES AUXILIARES E CONTADORES
// ==========================================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let indexFoto = 0;
let indexStart = 0;
let indexDisparo = 0;
let disparoEmAndamento = false;

function proximaFoto() {
    const foto = FOTOS_PREVIA[indexFoto % FOTOS_PREVIA.length];
    indexFoto++;
    return foto;
}

function proximaMsgStart() {
    const msg = BOAS_VINDAS_PICANTES[indexStart % BOAS_VINDAS_PICANTES.length];
    indexStart++;
    return msg;
}

function proximaMsgDisparo() {
    const msg = MENSAGENS_DISPARO[indexDisparo % MENSAGENS_DISPARO.length];
    indexDisparo++;
    return msg;
}

function tecladoConversao(incluirBotoesExtras = true) {
    const botoes = [
        [{ text: '🔥 ASSINAR PRIVACY AGORA (R$ 30,00) 🔞', url: PRIVACY_LINK }]
    ];

    if (incluirBotoesExtras) {
        botoes.push([
            { text: '📸 Mais uma prévia', callback_data: 'mais_previa' },
            { text: '💳 Como pagar / Acesso', callback_data: 'como_funciona' }
        ]);
    }

    return { inline_keyboard: botoes };
}

// ==========================================
// 1. COMANDO /start (CAPTURA LEAD + RESPOSTA PICANTE)
// ==========================================
bot.start(async (ctx) => {
    if (ctx.chat.type !== 'private') return;

    const userId = ctx.from.id.toString();
    const firstName = ctx.from.first_name || 'Amor';
    const username = ctx.from.username || '';

    // Salva ou atualiza o lead no Supabase
    await supabase.from('privacy_leads').upsert(
        { telegram_id: userId, first_name: firstName, username: username },
        { onConflict: 'telegram_id' }
    );

    const foto = proximaFoto();
    const legenda = proximaMsgStart();

    try {
        await ctx.replyWithPhoto(foto, {
            caption: legenda,
            parse_mode: 'HTML',
            reply_markup: tecladoConversao(true)
        });
    } catch (err) {
        // Fallback caso a foto falhe por algum motivo
        await ctx.replyWithHTML(legenda, {
            disable_web_page_preview: true,
            reply_markup: tecladoConversao(true)
        }).catch(() => {});
    }
});

// ==========================================
// 2. BOTÕES INTERATIVOS DO PRIVADO (FUNIL DE VENDAS)
// ==========================================
bot.action('mais_previa', async (ctx) => {
    await ctx.answerCbQuery('🔥 Enviando outra prévia...').catch(() => {});
    const foto = proximaFoto();

    const textosExtras = [
        `😈 <b>Gostou dessa, né?</b> Imagina ver em vídeo e sem nada cobrindo...\n\nPor <b>SÓ R$ 30,00</b> você libera tudo no meu Privacy agora 👇`,
        `💦 <b>Essa aqui quase foi banida...</b> O resto dela tá completo no meu Privacy! Acesso por <b>apenas R$ 30,00</b> 👇`,
        `🔞 <b>Última amostra grátis!</b> O conteúdo pesado mesmo tá guardado no meu Privacy por <b>SÓ R$ 30,00</b> 🔥👇`
    ];
    const textoAleatorio = textosExtras[Math.floor(Math.random() * textosExtras.length)];

    try {
        await ctx.replyWithPhoto(foto, {
            caption: textoAleatorio,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔞 QUERO VER TUDO AGORA (R$ 30,00)', url: PRIVACY_LINK }]
                ]
            }
        });
    } catch (err) {
        console.error('Erro ao enviar prévia extra:', err.message);
    }
});

bot.action('como_funciona', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const textoAjuda = `💳 <b>COMO LIBERAR SEU ACESSO (R$ 30,00):</b>\n\n1️⃣ Clique no botão abaixo para abrir meu perfil oficial no <b>Privacy</b>.\n2️⃣ Crie sua conta rápida (leva 30 segundos, 100% sigiloso).\n3️⃣ Escolha <b>PIX</b> ou Cartão.\n\n⚡ <b>No PIX o acesso libera na mesma hora</b> e você já assiste todos os meus vídeos e fotos sem censura!`;

    await ctx.replyWithHTML(textoAjuda, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔥 IR PARA O PRIVACY (R$ 30,00)', url: PRIVACY_LINK }]
            ]
        }
    }).catch(() => {});
});

// ==========================================
// 3. DETECTOR DE GRUPOS E CANAIS (CADASTRA + POSTA + FIXA)
// ==========================================
bot.on('my_chat_member', async (ctx) => {
    const chat = ctx.chat;
    const status = ctx.myChatMember.new_chat_member.status;

    if (chat.type === 'private') return;

    // Se o bot foi removido ou expulso, apaga do banco
    if (['left', 'kicked'].includes(status)) {
        await supabase.from('privacy_groups').delete().eq('chat_id', chat.id.toString());
        console.log(`🗑️ [GRUPO REMOVIDO] ${chat.title} (${chat.id})`);
        return;
    }

    // Se o bot foi adicionado como membro ou administrador
    if (['member', 'administrator'].includes(status)) {
        await supabase.from('privacy_groups').upsert(
            { chat_id: chat.id.toString(), title: chat.title || 'Grupo sem nome' },
            { onConflict: 'chat_id' }
        );
        console.log(`✅ [NOVO GRUPO] ${chat.title} (${chat.id}) cadastrado!`);

        // Já faz uma primeira postagem e tenta fixar assim que entra
        try {
            const msgEnviada = await ctx.telegram.sendPhoto(chat.id, proximaFoto(), {
                caption: proximaMsgDisparo(),
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔥 ACESSAR PRIVACY AGORA (R$ 30,00) 🔞', url: PRIVACY_LINK }]
                    ]
                }
            });
            await ctx.telegram.pinChatMessage(chat.id, msgEnviada.message_id, { disable_notification: true }).catch(() => {});
        } catch (err) {
            console.log(`⚠️ Não foi possível postar ao entrar em ${chat.title}:`, err.message);
        }
    }
});

// ==========================================
// 4. MOTOR DE DISPARO AUTOMÁTICO (DE 3 EM 3 HORAS)
// ==========================================
async function executarDisparoGeral() {
    if (disparoEmAndamento) {
        console.log('⚠️ [AVISO] Já existe um disparo em execução. Ignorando...');
        return;
    }
    disparoEmAndamento = true;
    console.log('🚀 [DISPARO 3H] Iniciando envio em massa para privados e grupos...');

    try {
        // --- PARTE A: DISPARO NOS PRIVADOS (/start) ---
        const { data: leads } = await supabase.from('privacy_leads').select('telegram_id');
        let enviadosPv = 0;
        let bloqueadosPv = 0;

        if (leads && leads.length > 0) {
            for (const lead of leads) {
                const fotoAtual = proximaFoto();
                const textoAtual = proximaMsgDisparo();

                try {
                    await bot.telegram.sendPhoto(lead.telegram_id, fotoAtual, {
                        caption: textoAtual,
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🔥 ENTRAR NO PRIVACY (R$ 30,00) 🔞', url: PRIVACY_LINK }],
                                [{ text: '📸 Ver mais uma prévia', callback_data: 'mais_previa' }]
                            ]
                        }
                    });
                    enviadosPv++;
                } catch (err) {
                    const desc = err.response?.description || err.message || '';
                    // Se o usuário bloqueou o bot ou deletou a conta, limpa do banco
                    if (desc.includes('blocked') || desc.includes('deactivated') || desc.includes('chat not found')) {
                        await supabase.from('privacy_leads').delete().eq('telegram_id', lead.telegram_id);
                        bloqueadosPv++;
                    }
                }
                await sleep(120); // Pausa leve para respeitar limite do Telegram (evita ban)
            }
        }

        // --- PARTE B: DISPARO NOS GRUPOS + FIXAR MENSAGEM ---
        const { data: grupos } = await supabase.from('privacy_groups').select('chat_id, title');
        let enviadosGrupos = 0;

        if (grupos && grupos.length > 0) {
            for (const grupo of grupos) {
                const fotoAtual = proximaFoto();
                const textoAtual = proximaMsgDisparo();

                try {
                    const msgGrupo = await bot.telegram.sendPhoto(grupo.chat_id, fotoAtual, {
                        caption: textoAtual,
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🔥 ASSINAR PRIVACY AGORA (R$ 30,00) 🔞', url: PRIVACY_LINK }]
                            ]
                        }
                    });

                    // Fixa a mensagem no topo do grupo silenciosamente
                    await bot.telegram.pinChatMessage(grupo.chat_id, msgGrupo.message_id, {
                        disable_notification: true
                    }).catch(() => {});

                    enviadosGrupos++;
                } catch (err) {
                    const desc = err.response?.description || err.message || '';
                    // Se o bot foi expulso ou perdeu permissão de envio, remove do banco
                    if (desc.includes('kicked') || desc.includes('not a member') || desc.includes('chat not found') || desc.includes('have rights')) {
                        await supabase.from('privacy_groups').delete().eq('chat_id', grupo.chat_id);
                    }
                }
                await sleep(2000); // 2 segundos entre grupos
            }
        }

        console.log(`✅ [DISPARO CONCLUÍDO] PV: ${enviadosPv} enviados (${bloqueadosPv} bloqueados removidos) | Grupos: ${enviadosGrupos} enviados e fixados.`);
    } catch (e) {
        console.error('❌ [ERRO NO DISPARO]:', e);
    } finally {
        disparoEmAndamento = false;
    }
}

// Agenda para rodar a cada 3 horas (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
cron.schedule('0 */3 * * *', () => {
    executarDisparoGeral();
}, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
});

// ==========================================
// 5. PAINEL ADMIN E CAPTURA DE FILE_ID DE FOTOS
// ==========================================
// Quando VOCÊ (ADMIN_ID) enviar uma foto no privado do bot, ele devolve o código dela
bot.on('photo', async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID.toString()) return;

    const fotos = ctx.message.photo;
    const maiorResolucao = fotos[fotos.length - 1];
    await ctx.replyWithHTML(
        `📸 <b>Foto capturada com sucesso!</b>\n\nCopie o código abaixo e cole dentro da lista <code>FOTOS_PREVIA</code> no código:\n\n<code>'${maiorResolucao.file_id}',</code>`
    );
});

// Comando /admin para ver estatísticas e testar o disparo na hora
bot.command('admin', async (ctx) => {
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID.toString()) return;

    const { count: totalLeads } = await supabase.from('privacy_leads').select('*', { count: 'exact', head: true });
    const { count: totalGrupos } = await supabase.from('privacy_groups').select('*', { count: 'exact', head: true });

    await ctx.replyWithHTML(
        `📊 <b>PAINEL DO BOT PRIVACY</b>\n\n👤 Leads no Privado: <b>${totalLeads || 0}</b>\n👥 Grupos Ativos: <b>${totalGrupos || 0}</b>\n⏰ Frequência: <b>De 3 em 3 horas</b>`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Testar Disparo Agora', callback_data: 'forcar_disparo' }]
                ]
            }
        }
    );
});

bot.action('forcar_disparo', async (ctx) => {
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID.toString()) return;
    await ctx.answerCbQuery('🚀 Iniciando disparo manual...').catch(() => {});
    await ctx.reply('🚀 Disparo iniciado em segundo plano! Acompanhe os logs no Render.');
    executarDisparoGeral();
});

// ==========================================
// 6. INICIALIZAÇÃO DO BOT + SERVIDOR RENDER
// ==========================================
bot.catch((err) => console.error('❌ [ERRO TELEGRAF]:', err.message));

bot.launch().then(() => {
    console.log('🔥 Bot de divulgação Privacy ONLINE!');
});

const app = express();
app.get('/', (req, res) => res.send('🔥 Bot Privacy operando 24h!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
