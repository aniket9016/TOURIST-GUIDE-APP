// src/pages/MyBookings.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Pagination,
  CardMedia,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  getCarBookings,
  getFlightBookings,
  getHotelBookings,
  getRestaurantBookings,
  deleteCarBooking,
  deleteFlightBooking,
  deleteHotelBooking,
  deleteRestaurantBooking,
  getCarById,
  getFlightById,
  getHotelById,
  getRestaurantById,
} from "../api/getApis";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-toastify";

function isCancellable(dateStr: string) {
  const serviceDate = new Date(dateStr);
  const today = new Date();
  const diffDays = (serviceDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
  return diffDays >= 7;
}

// Helper function to get the appropriate service date field for each booking type
const getServiceDateField = (type: string) => {
  switch (type) {
    case "car":
      return "pickupDate"; // Use PickupDate from CarBooking table
    case "hotel":
      return "checkindate"; // Use Checkindate from HotelBooking table
    case "restaurant":
      return "mealDate"; // Use MealDate from RestaurantBooking table
    case "flight":
      return "bookingDate"; // For flights, we'll still use booking date as there's no separate flight date
    default:
      return "bookingDate";
  }
};

// Helper function to get service date from booking object
const getServiceDate = (booking: any, type: string) => {
  const dateField = getServiceDateField(type);
  return booking[dateField];
};

const CARDS_PER_PAGE = 3;

// Skeleton Card Component
const BookingCardSkeleton = () => (
  <Grid >
    <Card 
      elevation={4} 
      sx={{ 
        borderRadius: 3, 
        height: "100%",
        width: 350,
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto'
      }}
    >
      <Skeleton variant="rectangular" width="100%" height={200} />
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          textAlign: 'left',
          padding: 1.5,
          paddingBottom: 1
        }}
      >
        <Skeleton variant="text" sx={{ fontSize: '1.5rem', width: '80%' }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem', width: '100%', mt: 1 }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem', width: '90%' }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem', width: '70%' }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem', width: '60%' }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem', width: '80%' }} />
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', padding: 1, paddingTop: 0 }}>
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </CardActions>
    </Card>
  </Grid>
);

// Skeleton Section Component
const BookingSectionSkeleton = ({ title }: { title: string }) => (
  <Box my={4}>
    <Typography variant="h5" fontWeight={600} mb={2} textAlign="left">
      {title}
    </Typography>
    <Grid container spacing={3} justifyContent="center">
      {Array.from({ length: 3 }).map((_, index) => (
        <BookingCardSkeleton key={index} />
      ))}
    </Grid>
  </Box>
);

export default function MyBookings() {
  const token = useAuthStore((s) => s.token);
  const decoded: any = token ? jwtDecode(token) : null;
  const userID = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
  const username = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];

  const [carBookings, setCarBookings] = useState<any[]>([]);
  const [flightBookings, setFlightBookings] = useState<any[]>([]);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [restaurantBookings, setRestaurantBookings] = useState<any[]>([]);
  const [pages, setPages] = useState({ car: 1, flight: 1, hotel: 1, restaurant: 1 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"upcoming" | "past">("upcoming");

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBookingInfo, setSelectedBookingInfo] = useState<{
    type: string;
    id: string;
    date: string;
    isPast: boolean;
  } | null>(null);

  const getImageUrl = (type: string, image: string) =>
    `https://localhost:7032/Images/${type}/${image}`;

  const fetchDetails = async (type: string, bookings: any[]) => {
    const detailPromises = bookings.map(async (b) => {
      let details = null;
      try {
        switch (type) {
          case "car":
            details = await getCarById(b.carID);
            return { ...b, details: details.data };
          case "hotel":
            details = await getHotelById(b.hotelID);
            return { ...b, details: details.data };
          case "restaurant":
            details = await getRestaurantById(b.restaurantID);
            return { ...b, details: details.data };
          case "flight":
            details = await getFlightById(b.flightID);
            return { ...b, details: details.data };
          default:
            return b;
        }
      } catch (error) {
        console.error(`Error fetching ${type} details:`, error);
        return b;
      }
    });
    return await Promise.all(detailPromises);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [carRes, flightRes, hotelRes, restaurantRes] = await Promise.all([
        getCarBookings(),
        getFlightBookings(),
        getHotelBookings(),
        getRestaurantBookings(),
      ]);

      const userCars = (carRes.data as any[]).filter((b: any) => b.userID === userID);
      const userFlights = (flightRes.data as any[]).filter((b: any) => b.userID === userID);
      const userHotels = (hotelRes.data as any[]).filter((b: any) => b.userID === userID);
      const userRestaurants = (restaurantRes.data as any[]).filter((b: any) => b.userID === userID);

      const [carsWithDetails, flightsWithDetails, hotelsWithDetails, restaurantsWithDetails] =
        await Promise.all([
          fetchDetails("car", userCars),
          fetchDetails("flight", userFlights),
          fetchDetails("hotel", userHotels),
          fetchDetails("restaurant", userRestaurants),
        ]);

      setCarBookings(carsWithDetails);
      setFlightBookings(flightsWithDetails);
      setHotelBookings(hotelsWithDetails);
      setRestaurantBookings(restaurantsWithDetails);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userID) fetchAll();
  }, [userID]);

  const resetPaginationIfNeeded = (type: string, filteredLength: number) => {
    const currentPage = pages[type as keyof typeof pages];
    const maxPage = Math.ceil(filteredLength / CARDS_PER_PAGE);
    if (currentPage > maxPage && maxPage > 0) {
      setPages(prev => ({ ...prev, [type]: maxPage }));
    }
  };

  const handleCancelOrDelete = async () => {
    if (!selectedBookingInfo) return;
    const { type, id, date, isPast } = selectedBookingInfo;

    try {
      if (!isPast && !isCancellable(date)) {
        toast.warn("Bookings can only be cancelled at least 7 days in advance.");
        setConfirmDialogOpen(false);
        setSelectedBookingInfo(null);
        return;
      }

      // Show loading state during deletion
      setLoading(true);

      switch (type) {
        case "car":
          await deleteCarBooking(id);
          setCarBookings(prev => {
            const updated = prev.filter(booking => 
              (booking.carBookingID || booking.carBookingId || booking.id) !== id
            );
            setTimeout(() => {
              const filtered = filterBookings(updated, type);
              resetPaginationIfNeeded("car", filtered.length);
            }, 0);
            return updated;
          });
          break;
        case "flight":
          await deleteFlightBooking(id);
          setFlightBookings(prev => {
            const updated = prev.filter(booking => 
              (booking.flightBookingID || booking.flightBookingId || booking.id) !== id
            );
            setTimeout(() => {
              const filtered = filterBookings(updated, type);
              resetPaginationIfNeeded("flight", filtered.length);
            }, 0);
            return updated;
          });
          break;
        case "hotel":
          await deleteHotelBooking(id);
          setHotelBookings(prev => {
            const updated = prev.filter(booking => 
              (booking.hotelBookingID || booking.hotelBookingId || booking.id) !== id
            );
            setTimeout(() => {
              const filtered = filterBookings(updated, type);
              resetPaginationIfNeeded("hotel", filtered.length);
            }, 0);
            return updated;
          });
          break;
        case "restaurant":
          await deleteRestaurantBooking(id);
          setRestaurantBookings(prev => {
            const updated = prev.filter(booking => 
              (booking.restaurantBookingID || booking.restaurantBookingId || booking.id) !== id
            );
            setTimeout(() => {
              const filtered = filterBookings(updated, type);
              resetPaginationIfNeeded("restaurant", filtered.length);
            }, 0);
            return updated;
          });
          break;
      }

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} booking ${
          isPast ? "deleted" : "cancelled"
        } successfully.`
      );
      
      setConfirmDialogOpen(false);
      setSelectedBookingInfo(null);
      setLoading(false);
      
    } catch (error) {
      console.error(`Error ${isPast ? "deleting" : "cancelling"} booking:`, error);
      toast.error(`Failed to ${isPast ? "delete" : "cancel"} booking. Please try again.`);
      setLoading(false);
    }
  };

  // Updated filterBookings function to use service dates instead of booking dates
  const filterBookings = (bookings: any[], type: string) => {
    return bookings.filter((booking) => {
      const serviceDate = getServiceDate(booking, type);
      if (!serviceDate) return false;
      
      const serviceDateObj = new Date(serviceDate);
      const today = new Date();
      
      return view === "past"
        ? serviceDateObj < today
        : serviceDateObj >= today;
    });
  };

  const renderCards = (filtered: any[], type: string, isPast: boolean) => {
    const page = pages[type as keyof typeof pages];
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(getServiceDate(a, type));
      const dateB = new Date(getServiceDate(b, type));
      
      return isPast
        ? dateB.getTime() - dateA.getTime() // Past: most recent first
        : dateA.getTime() - dateB.getTime(); // Upcoming: earliest first
    });

    const start = (page - 1) * CARDS_PER_PAGE;
    const paginated = sorted.slice(start, start + CARDS_PER_PAGE);

    return (
      <>
        <Grid container spacing={3} justifyContent="center">
          {paginated.map((b) => {
            const item = b.details;
            if (!item) return null;

            let bookingId = "";
            switch (type) {
              case "car":
                bookingId = b.carBookingID || b.carBookingId || b.id;
                break;
              case "flight":
                bookingId = b.flightBookingID || b.flightBookingId || b.id;
                break;
              case "hotel":
                bookingId = b.hotelBookingID || b.hotelBookingId || b.id;
                break;
              case "restaurant":
                bookingId = b.restaurantBookingID || b.restaurantBookingId || b.id;
                break;
            }

            const serviceDate = getServiceDate(b, type);

            return (
              <Grid key={bookingId}>
                <Card 
                  elevation={4} 
                  sx={{ 
                    borderRadius: 3, 
                    height: "100%",
                    width: 350,
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '0 auto'
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    width="100%"
                    image={getImageUrl(type.charAt(0).toUpperCase() + type.slice(1), item.image)}
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                    sx={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '200px'
                    }}
                  />
                  <CardContent 
                    sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      textAlign: 'left',
                      padding: 1.5,
                      paddingBottom: 1
                    }}
                  >
                    <Typography fontWeight="bold" variant="h5" gutterBottom>
                      {item.name || item.airline || item.flightNumber}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      {item.desc || item.address || item.combinedDepLocation || 
                       `${item.departureLocation} → ${item.arrivalLocation}` ||
                       `Departure: ${item.departureTime}, Arrival: ${item.arrivalTime}`}
                    </Typography>
                    
                    {/* Service Date Display */}
                    <Typography variant="body1" mt={0.5}>
                      <strong>
                        {type === "car" && "Pickup Date:"}
                        {type === "hotel" && "Check-in Date:"}
                        {type === "restaurant" && "Meal Date:"}
                        {type === "flight" && "Flight Date:"}
                      </strong> {serviceDate ? new Date(serviceDate).toDateString() : "N/A"}
                    </Typography>
                    
                    {/* Additional date information for car and hotel */}
                    {type === "car" && b.returnDate && (
                      <Typography variant="body1">
                        <strong>Return Date:</strong> {new Date(b.returnDate).toDateString()}
                      </Typography>
                    )}
                    {type === "hotel" && b.checkoutdate && (
                      <Typography variant="body1">
                        <strong>Check-out Date:</strong> {new Date(b.checkoutdate).toDateString()}
                      </Typography>
                    )}
                    
                    <Typography variant="body1">
                      <strong>Booking Date:</strong> {new Date(b.bookingDate).toDateString()}
                    </Typography>
                    <Typography variant="body1">
                      <strong>User:</strong> {username}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Status:</strong> {b.status || b.bookingStatus || "Confirmed"}
                    </Typography>
                    {type === "flight" && (
                      <>
                        <Typography variant="body1">
                          <strong>Adults:</strong> {b.adults || 0}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Kids:</strong> {b.kids || 0}
                        </Typography>
                      </>
                    )}
                    {type === "restaurant" && (
                      <>
                        <Typography variant="body1">
                          <strong>Meal Time:</strong> {b.mealTime || "N/A"}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Total People:</strong> {b.totalPeople || 0}
                        </Typography>
                      </>
                    )}
                    {type === "hotel" && (
                      <>
                        <Typography variant="body1">
                          <strong>Room Type:</strong> {b.roomType || "N/A"}
                        </Typography>
                        <Typography variant="body1">
                          <strong>No. of People:</strong> {b.noofPeople || 0}
                        </Typography>
                      </>
                    )}
                    {type === "car" && (
                      <Typography variant="body1">
                        <strong>Rental Days:</strong> {b.rental_days || b.rentalDays || 0}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', padding: 1, paddingTop: 0 }}>
                    <Button
                      variant="outlined"
                      color={isPast ? "error" : "warning"}
                      startIcon={isPast ? <DeleteIcon /> : <CancelIcon />}
                      onClick={() => {
                        setSelectedBookingInfo({
                          type,
                          id: bookingId,
                          date: serviceDate,
                          isPast,
                        });
                        setConfirmDialogOpen(true);
                      }}
                      disabled={!bookingId}
                    >
                      {isPast ? "Delete" : "Cancel"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {Math.ceil(filtered.length / CARDS_PER_PAGE) > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              count={Math.ceil(filtered.length / CARDS_PER_PAGE)}
              page={page}
              onChange={(_, v) => setPages((prev) => ({ ...prev, [type]: v }))}
              color="primary"
            />
          </Box>
        )}
      </>
    );
  };

  const renderSection = (
    title: string,
    bookings: any[],
    type: string
  ) => {
    const filtered = filterBookings(bookings, type);
    if (filtered.length === 0) return null;

    return (
      <Box my={4}>
        <Typography variant="h5" fontWeight={600} mb={2} textAlign="left">
          {title}
        </Typography>
        {renderCards(filtered, type, view === "past")}
      </Box>
    );
  };

  const allFilteredCounts = [
    filterBookings(carBookings, "car").length,
    filterBookings(flightBookings, "flight").length,
    filterBookings(hotelBookings, "hotel").length,
    filterBookings(restaurantBookings, "restaurant").length,
  ];
  const hasAnyBooking = allFilteredCounts.some((count) => count > 0);

  // Show loading state
  if (loading) {
    return (
      <Box p={3}>
        <Skeleton variant="text" sx={{ fontSize: '2rem', width: '300px', mb: 2 }} />
        <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '250px', mb: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 1 }} />
        </Box>

        <BookingSectionSkeleton title="Car Bookings" />
        <BookingSectionSkeleton title="Flight Bookings" />
        <BookingSectionSkeleton title="Hotel Bookings" />
        <BookingSectionSkeleton title="Restaurant Bookings" />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={2} textAlign="left">
        Welcome, {username || "User"}
      </Typography>
      <Typography variant="h6" color="text.secondary" mb={3} textAlign="left">
        Here are your bookings:
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
        >
          <ToggleButton value="upcoming">Upcoming Bookings</ToggleButton>
          <ToggleButton value="past">Past Bookings</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {hasAnyBooking ? (
        <Box>
          {renderSection("Car Bookings", carBookings, "car")}
          {renderSection("Flight Bookings", flightBookings, "flight")}
          {renderSection("Hotel Bookings", hotelBookings, "hotel")}
          {renderSection("Restaurant Bookings", restaurantBookings, "restaurant")}
        </Box>
      ) : (
        <Typography variant="h6" color="text.secondary" textAlign="center" mt={4}>
          No {view === "upcoming" ? "upcoming" : "past"} bookings found.
        </Typography>
      )}

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          Confirm {selectedBookingInfo?.isPast ? "Delete" : "Cancel"} Booking
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {selectedBookingInfo?.isPast ? "delete" : "cancel"} this
            booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            No, Keep Booking
          </Button>
          <Button onClick={handleCancelOrDelete} variant="contained" color="error">
            Yes, {selectedBookingInfo?.isPast ? "Delete" : "Cancel"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}