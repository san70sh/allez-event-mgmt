import React, { useState, useEffect } from "react";
import IEvent from "../models/events.model";
import axios, { AxiosResponse } from "axios";
import noImage from "../assets/noImage.jpg";
import { Link } from "react-router-dom";
import LoadingSpinner from "./Loading";
import EventCache from "./EventCache";

const events: React.FC = () => {
  // const [events, setEvents] = useState<IEvent[]>([]);
  const [displayedEvents, setDisplayedEvents] = useState<IEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  let card: JSX.Element[] = [];
  useEffect(() => {
    let fetchEventList = async () => {
      setLoading(true);
      let eventData: AxiosResponse<IEvent[]> = await axios.get("http://localhost:3000/events/", {
        withCredentials: true,
      });
      if (eventData.data) {
        let events = eventData.data.map(async (event) => {
          if(event.eventImg) {
            let imageSrc = `https://d3noxwp5lu0fvc.cloudfront.net/${event.eventImg}`
            event.eventImg = imageSrc
          }
        })
        await Promise.all(events)
      }
      setLoading(false);
      setDisplayedEvents(eventData.data);
    };
    fetchEventList();

  }, []);

  if (loading) {
    return (
      <div className="flex justify-center mx-auto">
        <LoadingSpinner width="12" height="12"/>

      </div>
    );
  }

  const filters = () => {
    
  }

  const eventCard = (event: IEvent): JSX.Element => {
    let imgSrc = ""
    if (event.eventImg) {
      imgSrc = event.eventImg
    } else {
      imgSrc = noImage
    }
    return (
      <div
        className="max-w-sm rounded-xl overflow-hidden h-auto scale-90 shadow-md hover:scale-110 hover:duration-150 duration-150"
        key={event._id}
      >
        <Link to={`events/${event._id}`}>
          <div className="relative px-6 py-4 text-center">
            <img src={imgSrc} className="mx-auto aspect-[16/10] object-cover"/>
            <div className="font-bold text-xl my-2">{event.name}</div>
            <p className="text-gray-700 text-base font-semibold">
              {event.venue.city}, {event.venue.state}
            </p>
            <p className="text-gray-700 text-base font-semibold">
              {event.bookedSeats} / {event.totalSeats}
            </p>
          </div>
          <div className="px-6 pt-4 pb-2 mt-5 bottom-0">
            {event.category.map((cat) => {
              return (
                <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2" key={cat}>
                  #{cat}
                </span>
              );
            })}
          </div>
        </Link>
      </div>
    );
  };

  if (displayedEvents && displayedEvents.length > 0) {
    card = displayedEvents.map((event) => {
      return eventCard(event);
    });
  }
  return (
    <div>
      <div className="grid grid-cols-9">
        <button className="px-4 mx-32 rounded-sm col-start-2 col-end-4 font-mono border-2">All</button>
        <button className="px-4 mx-32 rounded-sm col-start-4 col-end-7 border-2">Going</button>
        <button className="px-4 py-2 mx-32 rounded-sm col-start-7 col-end-9 border-2">Saved</button>
      </div>
      {displayedEvents ? (
        <div className="grid grid-cols-5">
          <div className="col-start-1 col-span-1 grid grid-flow-row">
            <div>
              <p>Filters</p>
            </div>
            <div>
              <EventCache/>
            </div>
          </div>
          <div className="mt-5 col-start-2 col-span-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-cols-max h-fit">
            {card}
          </div>
        </div>
        ): 
        <p>No Events</p>
      }
    </div>
  );
};

export default events;
