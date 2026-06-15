GetCreatorCard {
  path /creator-cards/:slug
  method GET

  params {
    slug string
  }

  query {
    access_code? string
  }
}
