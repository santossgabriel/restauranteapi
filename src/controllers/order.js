import HttpStatus from 'http-status'
import { sequelize, Order, Item, ItemOrder } from '../infra/db'

const validate = (order) => {
  let msg = ''
  if (!order.date || (new Date(order.date)).toString() == 'Invalid Date') msg = 'Data do pedido é inválida.'
  if (!order.resume) msg = 'Resumo inválido'
  if (isNaN(order.table) || order.table < 1) msg = 'Mesa inválida'
  if (!order.name) msg = 'O nome do representante da mesa é inválido'
  if (!Array.isArray(order.items) || order.items.length == 0) msg = 'O pedido deve possuir itens'
  return msg
}

export default class Controller {

  getAll(req, res) {
    Order.findAll({ include: Item })
      .then(result => { res.json({ orders: result }) })
      .catch(err => res.end(err.message))
  }

  getById(req, res) {

    const id = req.params.id

    if (isNaN(id)) {
      res.end('Parâmetro inválido')
      return
    }

    Order.findOne({ where: { id: id }, include: Item })
      .then(result => { res.json(result) })
      .catch(err => res.end(err.message))
  }

  create(req, res) {

    const order = req.body
    const msg = validate(order)

    if (msg) {
      res.end(msg)
      return
    }

    sequelize.transaction(t => {
      return Order.create(order, { transaction: t })
        .then(result => {

          let promisses = []
          for (let i = 0; i < order.items.length; i++)
            promisses.push(ItemOrder.create(
              { itemId: order.items[i], orderId: result.id },
              { transaction: t }
            ))

          return Promise.all(promisses)
        })
    }).then(result => res.json(result))
      .catch(err => res.end(err.message))
  }

  delete(req, res) {
    const id = req.params.id

    if (isNaN(id)) {
      res.end('Parâmetro inválido')
      return
    }

    sequelize.transaction(t => {
      return ItemOrder.destroy({ where: { orderId: id } }, { transaction: t })
        .then(result => {
          return Order.destroy({ where: { id: id } }, { transaction: t })
        })
    }).then(result => res.end('Removido com sucesso.'))
      .catch(err => res.end(err.message))
  }

  ok(req, res) {
    const order = req.body

    if (isNaN(order.id)) {
      res.end('Parâmetro "id" inválido')
      return
    }

    Order.update({ ok: order.ok ? 1 : 0 }, { where: { id: order.id } })
      .then(result => res.end('Situação alterada com sucesso.'))
      .catch(err => res.end(err.message))
  }
}
