import FlightTemplate from "../compo/FlightTemplate";

const DomesticFlightsPage = () => {
    return (
        <FlightTemplate 
            type="domestic"
            title="Domestic Flights"
            subtitle="Explore Bangladesh"
            bgImage="/asset/blog/blog1.webp" 
        />
    );
};

export default DomesticFlightsPage;