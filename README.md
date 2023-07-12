# Carbon Bear XRPL
[Deployed Link](https://carbon-bear-xrpl.fly.dev/)

The Carbon Reduction App is a revolutionary platform designed to empower individuals and businesses in their efforts to reduce carbon emissions and contribute to a greener future. By leveraging cutting-edge technology, including blockchain and cryptocurrency, our app aims to create a transparent and efficient marketplace for carbon reduction initiatives. Here's how it works:

## User Role:

As an end user or common person, you can actively participate in carbon reduction by purchasing products that are designed to minimize carbon emissions. Once you make a qualifying purchase, you can verify it within the app. Upon verification, the app will reward you with carbon tokens called BEAR (Carbon Emission Avoidance Reward). BEAR tokens function similarly to cryptocurrencies, representing your carbon reduction efforts.

## Token Exchange:

With BEAR tokens in hand, you have the option to exchange them for XRP currency, a widely recognized cryptocurrency. The XRP currency can later be converted into Fiat currency, providing you with a tangible incentive for your eco-friendly actions. This integration of blockchain technology ensures secure and transparent transactions, protecting the value of your earned BEAR tokens.

## Company Role:

Companies that produce carbon emissions as part of their operations, such as restaurants or mills, can also participate in our app. These businesses can visit the platform to purchase BEAR tokens, which are available for sale. By acquiring BEAR tokens, companies can offset their carbon footprint and demonstrate their commitment to sustainability. In exchange for BEAR tokens, companies can make use of the app's token exchange feature to acquire XRP tokens.

By embracing the power of blockchain technology and individual actions, the Carbon Bear App aims to create a sustainable and incentivized ecosystem where both individuals and businesses can play an integral role in reducing carbon emissions.

Please note that all the transactions in this app are being done with **testnet** so they are test transactions and no actual accounts will be affected from any of the transactions in this app.


## Environment Variables

You will need to set up the following environment variables by creating a `.env` file at the root of the project:

```
SESSION_SECRET="305cb8b1237b0a3457cf647a1c436526"
ENCRYPTION_SECRET="80e16c71d439d2cc5e49e5da29982ed5"
INTERNAL_COMMAND_TOKEN="39170737c956c76eee516cfeee47ea0f"

# Admin wallet config.
ADMIN_ACCOUNT_ID="XRPL_ACCOUNT_ID"
ADMIN_SEED="XRPL_ACCOUNT_SEED"
XRPL_DOMAIN="example.com"
```

## Installation

To install the project and its dependencies, run the following command:

```
npm install
```

Please ensure that you have Node.js v18 installed before proceeding.

## Usage

To start the project in development mode, use the following command:

```
npm run dev
```