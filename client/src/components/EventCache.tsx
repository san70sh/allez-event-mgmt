import { useAuth0 } from "@auth0/auth0-react"
import IEvent from "../models/events.model";
import React from "react";
import axios, {AxiosResponse} from "axios";
import { Link } from "react-router-dom";

const EventCache: React.FC = () => {
    const {user, getAccessTokenSilently} = useAuth0();
    const [cachedEvents, setCachedEvents] = React.useState<IEvent[]>([])
    const [loading, setLoading] = React.useState<boolean>(false);
    let card: JSX.Element[] = [];

    React.useEffect(() => {
        let fetchCache = async () => {
            if(user) {
                setLoading(true);
                const token = await getAccessTokenSilently({
					audience: "localhost:5173/api",
					scope: "read:current_user",
				});
                let eventCache: AxiosResponse<IEvent[]> = await axios.get("http://localhost:3000/events/cache", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
                if (eventCache.status == 200 && eventCache.data) {
                    setCachedEvents(eventCache.data);
                    setLoading(false);
                }
            }
          };
        fetchCache();
    },[])

    const eventCard = (event: IEvent): JSX.Element => {
        return (
          <div
            className="max-w-sm rounded-xl overflow-hidden border hover:shadow-md hover:duration-200 duration-200"
            key={event._id}
          >
            <Link to={`events/${event._id}`}>
              <div className="relative px-6 py-4 text-center">
                <div className="font-bold text-md">{event.name}</div>
                <p className="text-gray-700 text-xs font-semibold">
                  {event.venue.city}, {event.venue.state}
                </p>
                <p className="text-gray-700 text-base font-semibold">
                  {event.bookedSeats} / {event.totalSeats}
                </p>
              </div>
              <div className="pt-2 pb-2 text-center">
                {event.category.map((cat) => {
                  return (
                    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-gray-700" key={cat}>
                      #{cat}
                    </span>
                  );
                })}
              </div>
            </Link>
          </div>
        );
      };

    if (cachedEvents && cachedEvents.length > 0) {
        card = cachedEvents.map((event) => {
          return eventCard(event);
        });
      }
    if (cachedEvents && cachedEvents.length > 0) {
        return (
            <div className="space-y-6 scale-90">
                <p className="text-center font-semibold underline font-sans -mb-2">Recently Visited</p>
                {card}
            </div>
        )
    } else {
        return (
            <></>
        )
    }

}

export default EventCache