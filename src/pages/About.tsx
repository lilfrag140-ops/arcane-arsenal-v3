import { ArrowLeft, Shield, Zap, Users, Award, Clock, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            About Donut Grocery
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted partner for Minecraft items, spawners, and in-game currency on DonutSMP.
          </p>
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-4">
              Founded with a passion for enhancing the Minecraft gaming experience, Donut Grocery has become 
              the premier marketplace for DonutSMP players. We understand the value of time and the importance 
              of having the right tools and resources to build, explore, and thrive in the Minecraft universe.
            </p>
            <p className="mb-4">
              What started as a simple idea to help fellow players access hard-to-find items has grown into 
              a comprehensive platform serving thousands of satisfied customers. We pride ourselves on offering 
              the most competitive prices, fastest delivery times, and exceptional customer service in the industry.
            </p>
            <p>
              Our commitment to the Minecraft community drives everything we do. We're not just a marketplace - 
              we're fellow gamers who understand your needs and are dedicated to helping you achieve your 
              in-game goals.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="card-modern">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Secure & Safe</h3>
              <p className="text-muted-foreground">
                All transactions are processed through secure payment gateways with industry-standard encryption.
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Instant Delivery</h3>
              <p className="text-muted-foreground">
                Most items are delivered within minutes. Spawners and special items may take up to 24 hours.
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6 text-center">
              <Award className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Best Prices</h3>
              <p className="text-muted-foreground">
                We guarantee the most competitive prices in the market with regular discounts and promotions.
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Community Focused</h3>
              <p className="text-muted-foreground">
                Built by gamers, for gamers. We understand the Minecraft community and its unique needs.
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">24/7 Availability</h3>
              <p className="text-muted-foreground">
                Our automated systems work around the clock to ensure you can shop whenever you need.
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6 text-center">
              <Headphones className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Premium Support</h3>
              <p className="text-muted-foreground">
                Our dedicated support team is always ready to help with any questions or concerns.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Our Mission */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            To empower Minecraft players with easy access to essential items and resources, enabling them to 
            focus on what they love most - creating, building, and exploring amazing worlds. We strive to be 
            the most trusted and reliable marketplace in the Minecraft community.
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of satisfied customers and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="btn-primary">
                Start Shopping
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;