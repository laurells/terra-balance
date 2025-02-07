import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { NextComponentType, NextPageContext } from "next";
import Head from 'next/head';
import { useRouter } from 'next/router';

type AppCustomProps = {
    Component: NextComponentType<NextPageContext, any, {}>;
    pageProps: any;
}

export default function App({ Component, pageProps }: AppCustomProps) {
    const router = useRouter();

    return (
        <Fragment>
          <Head>
            <title>Terra Balance Ecommerce</title>
          </Head>
          <Component {...pageProps} />
        </Fragment>
      );
    }