export function getMeController(req, res) {
  res.json(req.user)
}
