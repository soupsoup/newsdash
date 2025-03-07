import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconBgColor: string;
  change?: {
    value: number | string;
    isPositive: boolean;
  };
  changeText?: string;
}

const StatsCard = ({ title, value, icon, iconBgColor, change, changeText }: StatsCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[#757575] text-sm">{title}</p>
            <p className="text-2xl font-bold text-[#212121]">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <span className="material-icons text-[#1976d2]">{icon}</span>
          </div>
        </div>
        
        {change && (
          <div className="mt-2 flex items-center text-sm">
            <span className={`${change.isPositive ? 'text-[#4caf50]' : 'text-[#f44336]'} flex items-center`}>
              <span className="material-icons text-sm">
                {change.isPositive ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{change.value}</span>
            </span>
            {changeText && <span className="text-[#757575] ml-2">{changeText}</span>}
          </div>
        )}
        
        {!change && changeText && (
          <div className="mt-2 flex items-center text-sm">
            <span className="text-[#757575]">{changeText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
