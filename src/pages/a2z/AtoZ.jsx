import { useEffect, useState } from "react";
import { useSearchParams, Link, useParams } from "react-router-dom";
import getCategoryInfo from "@/src/utils/getCategoryInfo.utils";
import CategoryCard from "@/src/components/categorycard/CategoryCard";
import Loader from "@/src/components/Loader/Loader";
import Error from "@/src/components/error/Error";
import PageSlider from "@/src/components/pageslider/PageSlider";
import { Helmet } from "react-helmet-async";
import {
  generateAZListMeta,
  generatePaginationLinks,
  generateCanonicalUrl,
  generateCollectionSchema,
} from "@/src/utils/seo.utils";

function AtoZ() {
  const { letter } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categoryInfo, setCategoryInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);

  const page = parseInt(searchParams.get("page")) || 1;

  const currentLetter = letter ? letter.toLowerCase() : "az-list";

  const apiPath =
  !letter || letter.toLowerCase() === "all"
    ? "az-list"
    : letter === "#"
    ? "az-list/other"
    : `az-list/${letter.toLowerCase()}`;

  useEffect(() => {
    const fetchAtoZInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCategoryInfo(apiPath, page);

        const results =
          data?.data ||
          data?.results ||
          data?.animes ||
          data ||
          [];

        setCategoryInfo(Array.isArray(results) ? results : []);
        setTotalPages(data?.totalPages || data?.total_pages || 1);
      } catch (err) {
        console.error("Error fetching A-Z info:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAtoZInfo();
    window.scrollTo(0, 0);
  }, [apiPath, page]);

  if (loading) return <Loader type="AtoZ" />;
  if (error) return <Error />;

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage });
  };

  const { title, description, keywords } = generateAZListMeta(
    currentLetter,
    page
  );

  const canonicalUrl = generateCanonicalUrl(
    `/az-list/${currentLetter === "az-list" ? "" : currentLetter}${
      page > 1 ? `?page=${page}` : ""
    }`
  );

  const paginationLinks = generatePaginationLinks(
    `/az-list/${currentLetter}`,
    page,
    totalPages
  );

  const collectionSchema = generateCollectionSchema(
    categoryInfo,
    `Anime starting with ${currentLetter}`,
    `az-list/${currentLetter}`
  );

  const letters = [
    "All",
    "#",
    "0-9",
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <link rel="canonical" href={canonicalUrl} />

        {paginationLinks.map((link, index) => (
          <link key={index} rel={link.rel} href={link.href} />
        ))}

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {collectionSchema && (
          <script type="application/ld+json">
            {JSON.stringify(collectionSchema)}
          </script>
        )}
      </Helmet>

      <div className="max-w-[1600px] mx-auto flex flex-col mt-[90px] px-4">
        <div className="flex flex-col gap-y-3 mt-6">
          <h1 className="font-bold text-2xl text-white">Sort By Letters</h1>

          <div className="flex gap-x-[7px] flex-wrap justify-start gap-y-2">
            {letters.map((item, index) => {
              const linkPath =
                item.toLowerCase() === "all"
                  ? ""
                  : item === "#"
                  ? "other"
                  : item.toLowerCase();

              const isActive =
                (!letter && item === "All") ||
                (currentLetter === "other" && item === "#") ||
                currentLetter === item.toLowerCase();

              return (
                <Link
                  to={`/az-list/${linkPath}`}
                  key={index}
                  className={`text-md py-1 px-4 rounded-md font-bold transition-all ${
                    isActive
                      ? "text-black bg-white"
                      : "text-white bg-[#1b1b1b] hover:text-black hover:bg-white"
                  }`}
                >
                  {item}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="w-full flex flex-col gap-y-8">
          {categoryInfo.length > 0 ? (
            <>
              <CategoryCard
                data={categoryInfo}
                limit={categoryInfo.length}
                showViewMore={false}
                className="mt-8"
                cardStyle="grid-cols-8 max-[1600px]:grid-cols-6 max-[1200px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-3 max-[478px]:gap-x-2"
              />

              <div className="flex justify-center w-full mt-8">
                <PageSlider
                  page={page}
                  totalPages={totalPages}
                  handlePageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center text-gray-400">
              No anime found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AtoZ;
