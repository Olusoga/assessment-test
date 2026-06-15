DeleteCreatorCard {
  path /creator-cards/:slug
  method DELETE

  params {
    slug string
  }

  body {
    creator_reference string<trim|length:20>
  }
}
