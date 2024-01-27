# nodeShop

E-commerce application built with NodeJS, EJS and MongoDB.

## Overview

This application allows user authentication and CRUD operations. It also simulates payments using Stripe and sends e-mails with Sendgrid.

## Prerequisits

Make sure you have the following installed and configured in order to run this project locally:

- [Node.js](https://nodejs.org/en)
- [A MongoDB database](https://www.mongodb.com/pt-br)
- [Sendgrid API Key](https://sendgrid.com/en-us)
- [Stripe API Key](https://stripe.com/en-mx?utm_campaign=BR_en_Search_Brand_Brand_EXA-15088005049&utm_medium=cpc&utm_source=google&ad_content=556495423092&utm_term=stripe&utm_matchtype=e&utm_adposition=&utm_device=c&gclid=CjwKCAiAzc2tBhA6EiwArv-i6YqFQdsNTwbcVtXWfJ_Ndd5zO0LEl9UugSpQsfTeNYG7u1iQxV0fyhoCgCcQAvD_BwE)

## Installation

1. Clone the repository

   ```bash
   git clone https://github.com/vanessaike/node-shop.git
   ```

2. Install dependencies

   ```bash
   npm install
   ```

## Configuration

1. Create **.env** file
2. Configure **.env** variables:

   ```bash
   MONGO_USER=mongodb_connection_string
   MONGO_PASSWORD=mongodb_connection_password
   MONGO_DEFAULT_DATABASE=mongodb_database
   SESSION_SECRET=any_code_of_your_choice
   SENDGRID_KEY=your_sendgrid_api_key
   STRIPE_KEY=your_stripe_api_key
   ```

## Usage

1. Start the application:

   ```bash
   npm start
   ```

2. Open your browser and visit http://localhost:3000
3. Create an account in order to interact with products
