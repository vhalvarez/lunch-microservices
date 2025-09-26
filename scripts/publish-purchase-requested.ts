import { Bus } from '@lunch/messaging'
import { Exchanges, RoutingKeys } from '@lunch/shared-kernel'
import { randomUUID } from 'crypto'

async function main() {
  const bus = new Bus({
    url: process.env.AMQP_URL || 'amqp://guest:guest@localhost',
    prefetch: 30,
  })
  await bus.connect()

  await bus.publish(
    Exchanges.purchase,
    RoutingKeys.purchaseRequested,
    {
      messageId: randomUUID(),
      plateId: randomUUID(),
      shortages: [
        { ingredient: 'ketchup', missing: 3 },  
        { ingredient: 'tomato',  missing: 2 }
      ]
    }
  )

  console.log('published purchase.requested')
}

main().catch(console.error)
