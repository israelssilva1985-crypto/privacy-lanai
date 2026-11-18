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
// 📸🎥 BANCO DE FOTOS E VÍDEOS DE PRÉVIA (ROTAÇÃO)
// ==========================================
// Envie suas fotos ou vídeos no privado do bot (com sua conta ADMIN_ID).
// Ele vai responder com a linha pronta para você colar aqui dentro:
const MIDIAS_PREVIA = [
    { tipo: 'foto', id: 'AgACAgEAAxkBAAMFavx-Dg5rqSdLES55y0GME6Iz_j8AAnMNaxsBfOhHyTigGvOTLBABAAMCAAN5AAM9BA' },
    { tipo: 'video', id: 'BAACAgEAAxkBAAMIavx-DhBfusnE91sjkVrfKDGCVPkAAqAIAAIBfOhH4lpmBmdWBbA9BA' },
    { tipo: 'foto', id: 'AgACAgEAAxkBAAMMavx-DnZ7dmslVYSNGLBSrDuCoIgAAnoNaxsBfOhHOkXVYi9lBiwBAAMCAAN5AAM9BA' },
    { tipo: 'foto', id: 'AgACAgEAAxkBAAMNavx-DiFuyvtxSvkoaR2YXj263NAAAngNaxsBfOhHpv2tbgGTMB0BAAMCAAN5AAM9BA' },
    { tipo: 'video', id: 'BAACAgEAAxkBAAMHavx-DodYCuclNDDmzYYqncz9cqsAAp8IAAIBfOhHmkVgs7MkkLw9BA' },
    { tipo: 'foto', id: 'AgACAgEAAxkBAAMLavx-DqApgevDxFAuYtMKTgOZImUAAnkNaxsBfOhHrlCMIqepXU4BAAMCAAN5AAM9BA' },
    { tipo: 'foto', id: 'AgACAgEAAxkBAAMJavx-Dqwb_XOiW48dRGiTf5Jg8x0AAncNaxsBfOhH3L5t-N1cFDABAAMCAAN5AAM9BA' },
    { tipo: 'foto', id: 'AgACAgEAAxkBAAMKavx-Doh0LyAfEAL1CHmWtQQSujQAAnYNaxsBfOhHvm-N9QWT-CkBAAMCAAN4AAM9BA' },
    { tipo: 'foto', id: 'AgACAgEAAxkBAAMGavx-DoXhOflN2WUmCDPd2Kfnz4kAAnQNaxsBfOhHB-zDUTYj_M0BAAMCAAN5AAM9BA' }
    // Exemplo de como vai ficar quando você adicionar seus arquivos:
    // { tipo: 'foto', id: 'AgACAgEAAxkBAA...' },
    // { tipo: 'video', id: 'BAACAgEAAxkBAA...' },
];

// ==========================================
// 🔥 MENSAGENS PICANTES DE BOAS-VINDAS (/start)
// ==========================================
const BOAS_VINDAS_PICANTES = [
    `😈 <b>Oi amor, que bom que você veio...</b>\n\nAqui no Telegram eu preciso me comportar, mas no meu <b>Privacy</b> eu mostro TUDO sem censura e sem cortes 🔞💦\n\n🔥 Vídeos íntimos completos\n🔥 Bastidores bem safados\n🔥 Chat privado comigo\n\n💸 <b>É SÓ R$ 30,00</b> para liberar o acesso completo agora mesmo! Vem me ver bem de pertinho 👇`,

    `🤫 <b>Psiu... tava te esperando!</b>\n\nEssa prévia é só uma pequena amostra do que eu aprontei hoje... O vídeo completo ficou proibido demais pra postar aqui 🔥😈\n\nPor <b>APENAS R$ 30,00</b> você destrava meu <b>Privacy VIP</b> com dezenas de vídeos e fotos sem nenhuma censura 💋\n\n👇 <b>Clica abaixo antes que eu tire da promoção:</b>`,

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

    `🌶️ <b>Uma prévia pra deixar seu dia mais quente...</b>\n\nQuer ver o que aconteceu depois disso? O vídeo completo tá disponível agora no meu <b>Privacy</b> 🔞\n\n💎 Acesso total por <b>apenas R$ 30,00</b>! Clica abaixo e vem 👇`
];

// ==========================================
// ⚙️ FUNÇÕES AUXILIARES E CONTADORES
// ==========================================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let indexMidia = 0;
let indexStart = 0;
let indexDisparo = 0;
let disparoEmAndamento = false;

function proximaMidia() {
    const midia = MIDIAS_PREVIA[indexMidia % MIDIAS_PREVIA.length];
    indexMidia++;
    return midia;
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

// Função inteligente que identifica se é foto ou vídeo e envia automaticamente
async function enviarMidia(telegram, chatId, midia, caption, replyMarkup) {
    const opcoes = {
        caption: caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
    };

    if (midia.tipo === 'video') {
        return await telegram.sendVideo(chatId, midia.id, opcoes);
    } else {
        return await telegram.sendPhoto(chatId, midia.id, opcoes);
    }
}

function tecladoConversao(incluirBotoesExtras = true) {
    const botoes = [
        [{ text: '🔥 ASSINAR PRIVACY AGORA (R$ 30,00) 🔞', url: PRIVACY_LINK }]
    ];

    if (incluirBotoesExtras) {
        botoes.push([
            { text: '🔥 Mais uma prévia', callback_data: 'mais_previa' },
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

    await supabase.from('privacy_leads').upsert(
        { telegram_id: userId, first_name: firstName, username: username },
        { onConflict: 'telegram_id' }
    );

    const midia = proximaMidia();
    const legenda = proximaMsgStart();

    try {
        await enviarMidia(ctx.telegram, ctx.chat.id, midia, legenda, tecladoConversao(true));
    } catch (err) {
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
    const midia = proximaMidia();

    const textosExtras = [
        `😈 <b>Gostou dessa, né?</b> Imagina ver tudo sem censura e sem cortes...\n\nPor <b>SÓ R$ 30,00</b> você libera tudo no meu Privacy agora 👇`,
        `💦 <b>Essa prévia quase foi banida...</b> O resto dela tá completo no meu Privacy! Acesso por <b>apenas R$ 30,00</b> 👇`,
        `🔞 <b>Última amostra grátis!</b> O conteúdo pesado mesmo tá guardado no meu Privacy por <b>SÓ R$ 30,00</b> 🔥👇`
    ];
    const textoAleatorio = textosExtras[Math.floor(Math.random() * textosExtras.length)];

    try {
        await enviarMidia(ctx.telegram, ctx.chat.id, midia, textoAleatorio, {
            inline_keyboard: [
                [{ text: '🔞 QUERO VER TUDO AGORA (R$ 30,00)', url: PRIVACY_LINK }]
            ]
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

    if (['left', 'kicked'].includes(status)) {
        await supabase.from('privacy_groups').delete().eq('chat_id', chat.id.toString());
        console.log(`🗑️ [GRUPO REMOVIDO] ${chat.title} (${chat.id})`);
        return;
    }

    if (['member', 'administrator'].includes(status)) {
        await supabase.from('privacy_groups').upsert(
            { chat_id: chat.id.toString(), title: chat.title || 'Grupo sem nome' },
            { onConflict: 'chat_id' }
        );
        console.log(`✅ [NOVO GRUPO] ${chat.title} (${chat.id}) cadastrado!`);

        try {
            const msgEnviada = await enviarMidia(
                ctx.telegram,
                chat.id,
                proximaMidia(),
                proximaMsgDisparo(),
                {
                    inline_keyboard: [
                        [{ text: '🔥 ACESSAR PRIVACY AGORA (R$ 30,00) 🔞', url: PRIVACY_LINK }]
                    ]
                }
            );
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
                const midiaAtual = proximaMidia();
                const textoAtual = proximaMsgDisparo();

                try {
                    await enviarMidia(bot.telegram, lead.telegram_id, midiaAtual, textoAtual, {
                        inline_keyboard: [
                            [{ text: '🔥 ENTRAR NO PRIVACY (R$ 30,00) 🔞', url: PRIVACY_LINK }],
                            [{ text: '🔥 Ver mais uma prévia', callback_data: 'mais_previa' }]
                        ]
                    });
                    enviadosPv++;
                } catch (err) {
                    const desc = err.response?.description || err.message || '';
                    if (desc.includes('blocked') || desc.includes('deactivated') || desc.includes('chat not found')) {
                        await supabase.from('privacy_leads').delete().eq('telegram_id', lead.telegram_id);
                        bloqueadosPv++;
                    }
                }
                await sleep(120);
            }
        }

        // --- PARTE B: DISPARO NOS GRUPOS + FIXAR MENSAGEM ---
        const { data: grupos } = await supabase.from('privacy_groups').select('chat_id, title');
        let enviadosGrupos = 0;

        if (grupos && grupos.length > 0) {
            for (const grupo of grupos) {
                const midiaAtual = proximaMidia();
                const textoAtual = proximaMsgDisparo();

                try {
                    const msgGrupo = await enviarMidia(bot.telegram, grupo.chat_id, midiaAtual, textoAtual, {
                        inline_keyboard: [
                            [{ text: '🔥 ASSINAR PRIVACY AGORA (R$ 30,00) 🔞', url: PRIVACY_LINK }]
                        ]
                    });

                    await bot.telegram.pinChatMessage(grupo.chat_id, msgGrupo.message_id, {
                        disable_notification: true
                    }).catch(() => {});

                    enviadosGrupos++;
                } catch (err) {
                    const desc = err.response?.description || err.message || '';
                    if (desc.includes('kicked') || desc.includes('not a member') || desc.includes('chat not found') || desc.includes('have rights')) {
                        await supabase.from('privacy_groups').delete().eq('chat_id', grupo.chat_id);
                    }
                }
                await sleep(2000);
            }
        }

        console.log(`✅ [DISPARO CONCLUÍDO] PV: ${enviadosPv} enviados (${bloqueadosPv} bloqueados removidos) | Grupos: ${enviadosGrupos} enviados e fixados.`);
    } catch (e) {
        console.error('❌ [ERRO NO DISPARO]:', e);
    } finally {
        disparoEmAndamento = false;
    }
}

cron.schedule('0 */3 * * *', () => {
    executarDisparoGeral();
}, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
});

// ==========================================
// 5. PAINEL ADMIN E CAPTURA DE FOTOS E VÍDEOS
// ==========================================
bot.on(['photo', 'video'], async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID.toString()) return;

    if (ctx.message.photo) {
        const maiorResolucao = ctx.message.photo[ctx.message.photo.length - 1];
        await ctx.replyWithHTML(
            `📸 <b>Foto capturada!</b> Copie e cole dentro de <code>MIDIAS_PREVIA</code>:\n\n<code>{ tipo: 'foto', id: '${maiorResolucao.file_id}' },</code>`
        );
    } else if (ctx.message.video) {
        const videoId = ctx.message.video.file_id;
        await ctx.replyWithHTML(
            `🎥 <b>Vídeo capturado!</b> Copie e cole dentro de <code>MIDIAS_PREVIA</code>:\n\n<code>{ tipo: 'video', id: '${videoId}' },</code>`
        );
    }
});

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
