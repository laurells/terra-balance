import React from "react";
import Head from "next/head";

// Define  props
type Props = {
    title?: string;
    desc?: string;
    keywords?: string;
};

// Define default values for the description and keywords
const defaultDesc =
    "Terra Balance E-Commerce.";
const defaultKeywords =
    "Online Shop, E-commerce";

// Define the AppHeader component as a functional component
const AppHeader: React.FC<Props> = ({
    title = "Terra Balance",
    desc = defaultDesc,
    keywords = defaultKeywords,
}) => {
    // Return the Head component from Next.js with metadata
    return (
        <Head>
            {/* Set the title of the page */}
            <title>{title}</title>

            {/* Set the meta tags for description and keywords */}
            <meta content={desc} name="description" key="description" />
            <meta content={keywords} name="keywords" key="keywords" />

            {/* Set Open Graph (og) meta tags for social media sharing */}
            <meta property="og:description" content={desc} key="og_description" />
            <meta property="og:title" content={title} key="og_title" />

            {/* Set Twitter meta tags for Twitter card sharing */}
            <meta name="twitter:title" content={title} key="twitter_title" />
            <meta
                name="twitter:description"
                content={desc}
                key="twitter_description"
            />
        </Head>
    );
};

// Export the component
export default AppHeader;