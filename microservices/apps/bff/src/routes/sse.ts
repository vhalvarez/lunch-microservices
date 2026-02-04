import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Exchanges, RoutingKeys } from '@lunch/shared-kernel';
import type { RouteContext } from '../interfaces/routes.interface.js';

// Simple set de clientes conectados
const clients = new Set<FastifyReply>();

export function registerSSERoutes(router: FastifyInstance, ctx: RouteContext) {
    console.log('🚀 Initializing SSE routes...');

    // Endpoint SSE
    router.get('/events', async (req: FastifyRequest, reply: FastifyReply) => {
        // Configurar headers SSE
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'X-Accel-Buffering': 'no',
        });

        // Agregar cliente al set
        clients.add(reply);
        console.log(`✅ SSE client connected, total clients: ${clients.size}`);
        ctx.log.info({ totalClients: clients.size }, 'SSE client connected');

        // Enviar mensaje de bienvenida
        reply.raw.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

        // Cleanup cuando se desconecta
        req.raw.on('close', () => {
            clients.delete(reply);
            console.log(`👋 SSE client disconnected, remaining: ${clients.size}`);
            ctx.log.info({ totalClients: clients.size }, 'SSE client disconnected');
        });
    });

    // Suscribirse SOLO a plate:prepared como prueba
    ctx.bus.subscribe(
        'sse.plate.q',
        [{ exchange: Exchanges.plate, rk: RoutingKeys.platePrepared }],
        async (event: unknown) => {
            console.log(`📨 Received plate:prepared event:`, event);
            broadcast('plate:prepared', event);
        }
    );

    // Suscribirse a purchase:completed para actualizar inventario
    ctx.bus.subscribe(
        'sse.purchase.q',
        [{ exchange: Exchanges.purchase, rk: RoutingKeys.purchaseCompleted }],
        async (event: unknown) => {
            console.log(`📨 Received purchase:completed event:`, event);
            broadcast('purchase:completed', event);
        }
    );

    function broadcast(type: string, data: unknown) {
        if (clients.size === 0) return;

        const message = JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString()
        });

        clients.forEach((client) => {
            try {
                // Formato estándar SSE: 
                // event: nombre_evento
                // data: json_payload
                client.raw.write(`event: ${type}\ndata: ${message}\n\n`);
            } catch (err) {
                clients.delete(client);
            }
        });
    }

    console.log('✅ SSE routes initialized successfully');
    ctx.log.info('SSE routes initialized');
}
