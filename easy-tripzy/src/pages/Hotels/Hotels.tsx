import { useEffect, useState, type JSX } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Pagination,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RoomIcon from "@mui/icons-material/Room";
import PublicIcon from "@mui/icons-material/Public";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import HotelIcon from "@mui/icons-material/Hotel";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import InfoIcon from "@mui/icons-material/Info";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BusinessIcon from "@mui/icons-material/Business";
import { useNavigate } from "react-router-dom";
import { getHotels } from "../../api/getApis";

interface Hotel {
  id: string;
  name: string;
  desc: string;
  country: string;
  city: string;
  address: string;
  price: number;
  rooms: number;
  people: number;
  package: string;
  image: string;
}

const iconMap: Record<string, JSX.Element> = {
  country: <PublicIcon fontSize="small" />,
  city: <LocationCityIcon fontSize="small" />,
  name: <HotelIcon fontSize="small" />,
};

export default function Hotels() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filtered, setFiltered] = useState<Hotel[]>([]);
  const [filters, setFilters] = useState({ country: "", city: "", name: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const rowsPerPage = 5;

  useEffect(() => {
    const fetchWithDelay = async () => {
      setLoading(true);
      const delay = new Promise((res) => setTimeout(res, 2000));
      const data = getHotels().then((res) => res.data as Hotel[]);
      const [_, hotels] = await Promise.all([delay, data]);
      setHotels(hotels);
      setFiltered(hotels);
      setLoading(false);
    };
    fetchWithDelay();
  }, []);

  useEffect(() => {
    const { country, city, name } = filters;
    const filteredList = hotels.filter((h) => {
      return (
        h.country.toLowerCase().includes(country.toLowerCase()) &&
        h.city.toLowerCase().includes(city.toLowerCase()) &&
        h.name.toLowerCase().includes(name.toLowerCase())
      );
    });
    setFiltered(filteredList);
    setPage(1);
  }, [filters, hotels]);

  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const handleReset = () => setFilters({ country: "", city: "", name: "" });

  return (
    <Box sx={{ mt: 2, pb: 6 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
        textAlign="center"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
        }}
      >
        <HotelIcon color="primary" /> Hotel Offers
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
        }}
      >
        <Box sx={{ flex: 2, order: { xs: 1, md: 0 } }}>
          {loading ? (
            Array.from({ length: rowsPerPage }).map((_, index) => (
              <Card
                key={index}
                sx={{
                  display: "flex",
                  height: { xs: "auto", sm: 200 },
                  flexDirection: { xs: "column", sm: "row" },
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: 8,
                  backgroundColor: "#fefefe",
                }}
              >
                <Skeleton
                  variant="rectangular"
                  width={200}
                  height="100%"
                  sx={{ flexShrink: 0 }}
                />
                <CardContent sx={{ flex: 1 }}>
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                  <Skeleton width="80%" />
                  <Skeleton width="90%" />
                  <Skeleton width="30%" />
                </CardContent>
              </Card>
            ))
          ) : paginated.length > 0 ? (
            paginated.map((h) => (
              <Card
                key={h.id}
                sx={{
                  display: "flex",
                  height: { xs: "auto", sm: 200 },
                  flexDirection: { xs: "column", sm: "row" },
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: 8,
                  backgroundColor: { xs: "#f9f9f9", md: "#f9f9ff" },
                }}
              >
                <CardMedia
                  component="img"
                  sx={{
                    width: { xs: "100%", sm: 200 },
                    height: { xs: 200, sm: "100%" },
                    objectFit: "cover",
                    borderRadius: { xs: "12px 12px 0 0", sm: "12px 0 0 12px" },
                    flexShrink: 0,
                  }}
                  image={
                    h.image
                      ? `https://localhost:7032/Images/Hotel/${h.image}`
                      : "/no-image.png"
                  }
                  alt={h.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/no-image.png";
                  }}
                />
                <CardContent
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      color="text.primary"
                    >
                      <BusinessIcon fontSize="small" /> {h.name}
                    </Typography>

                    <Typography
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 1,
                        color: "#444",
                        fontWeight: 500,
                      }}
                    >
                      <RoomIcon fontSize="small" /> {h.city}, {h.country}
                    </Typography>

                    <Typography
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        my: 1,
                        color: "#555",
                      }}
                    >
                      <InfoIcon fontSize="small" />
                      {h.desc}
                    </Typography>

                    <Typography
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: "#222",
                        fontWeight: "bold",
                      }}
                    >
                      <AttachMoneyIcon fontSize="small" />
                      ₹{h.price} / night - {h.package}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate("/hotel-detail", { state: h })}
                    >
                      View
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body1">No hotels found.</Typography>
          )}

          {!loading && Math.ceil(filtered.length / rowsPerPage) > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={Math.ceil(filtered.length / rowsPerPage)}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
              />
            </Box>
          )}
        </Box>

        {/* Filters */}
        <Box sx={{ flex: 1, order: { xs: 0, md: 1 } }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: 8,
              backgroundColor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <FilterAltIcon /> Filters
            </Typography>

            {["country", "city", "name"].map((field) => (
              <TextField
                key={field}
                label={`Filter by ${field}`}
                fullWidth
                size="small"
                value={filters[field as keyof typeof filters]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {iconMap[field]}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            ))}

            <Button
              variant="outlined"
              onClick={handleReset}
              startIcon={<RestartAltIcon />}
              sx={{
                mt: 1,
                borderColor: "black",
                color: "black",
                "&:hover": {
                  borderColor: "black",
                  backgroundColor: "#f0f0f0",
                },
              }}
            >
              Reset Filters
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
