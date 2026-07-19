import { useDispatch, useSelector } from "react-redux";
import { addNotification, setNotifications, clearNotifications } from "../store/slices/notificationSlice";

export default function useNotifications() {
  const dispatch = useDispatch();
  const list = useSelector((state) => state.notifications.list);

  const add = (notification) => dispatch(addNotification(notification));
  const set = (notifications) => dispatch(setNotifications(notifications));
  const clear = () => dispatch(clearNotifications());

  return { list, add, set, clear };
}
